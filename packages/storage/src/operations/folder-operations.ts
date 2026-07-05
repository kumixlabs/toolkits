/**
 * S3 folder operations implementation
 * Provides comprehensive folder management operations for S3-compatible storage providers
 */

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";

import { getMimeType } from "../helpers";
import type {
  CopyFolderOptions,
  CopyFolderResult,
  CreateFolderOptions,
  CreateFolderResult,
  DeleteFolderOptions,
  DeleteFolderResult,
  FileInfo,
  FolderExistsResult,
  FolderInfo,
  ListFoldersOptions,
  ListFoldersResult,
  RenameFolderOptions,
  RenameFolderResult,
  S3Config,
} from "../types";

/**
 * S3 folder operations implementation
 * Handles all folder-related operations for S3-compatible storage providers
 * @internal
 */
export class FolderOperations {
  constructor(
    private client: S3Client,
    private config: S3Config,
  ) {}

  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    try {
      // Ensure path ends with /
      const folderPath = options.path.endsWith("/") ? options.path : `${options.path}/`;

      // Create a placeholder object to represent the folder
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: folderPath,
        Body: "",
        ContentType: "application/x-directory",
      });

      await this.client.send(command);

      return {
        success: true,
        path: folderPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Create folder failed",
      };
    }
  }

  async deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult> {
    try {
      // Ensure path ends with /
      const folderPath = options.path.endsWith("/") ? options.path : `${options.path}/`;

      if (options.recursive) {
        // List all objects with the folder prefix
        const listCommand = new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: folderPath,
        });

        const listResult = await this.client.send(listCommand);

        if (!listResult.Contents || listResult.Contents.length === 0) {
          return {
            success: true,
            deletedFiles: [],
          };
        }

        // Delete all objects in the folder
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: listResult.Contents.map((obj) => ({ Key: obj.Key! })),
            Quiet: false,
          },
        });

        const deleteResult = await this.client.send(deleteCommand);

        const deletedFiles = deleteResult.Deleted?.map((obj) => obj.Key!).filter(Boolean) || [];

        return {
          success: true,
          deletedFiles,
        };
      } else {
        // Just delete the folder placeholder
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: [{ Key: folderPath }],
            Quiet: false,
          },
        });

        await this.client.send(deleteCommand);

        return {
          success: true,
          deletedFiles: [folderPath],
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete folder failed",
      };
    }
  }

  async listFolders(options: ListFoldersOptions = {}): Promise<ListFoldersResult> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: options.prefix,
        Delimiter: options.delimiter || "/",
        MaxKeys: options.maxKeys,
        ContinuationToken: options.continuationToken,
      });

      const result = await this.client.send(command);

      // Parse folders from common prefixes
      const folders: FolderInfo[] =
        result.CommonPrefixes?.map((cp) => {
          const path = cp.Prefix!;
          const name = path.split("/").filter(Boolean).pop() || "";

          return {
            name,
            path,
            size: 0, // Will be calculated separately if needed
            fileCount: 0, // Will be calculated separately if needed
            lastModified: new Date(),
          };
        }) || [];

      // Parse files from contents
      const files: FileInfo[] =
        result.Contents?.map((obj) => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          etag: obj.ETag?.replace(/"/g, "") || "",
          contentType: getMimeType(obj.Key!),
        })) || [];

      return {
        success: true,
        folders,
        files,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List folders failed",
      };
    }
  }

  async folderExists(path: string): Promise<FolderExistsResult> {
    try {
      // Ensure path ends with /
      const folderPath = path.endsWith("/") ? path : `${path}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: folderPath,
        MaxKeys: 1,
      });

      const result = await this.client.send(command);

      const exists =
        (result.Contents && result.Contents.length > 0) ||
        (result.CommonPrefixes && result.CommonPrefixes.length > 0);

      if (exists) {
        const name = folderPath.split("/").filter(Boolean).pop() || "";

        return {
          exists: true,
          folderInfo: {
            name,
            path: folderPath,
            size: 0,
            fileCount: 0,
            lastModified: new Date(),
          },
        };
      }

      return { exists: false };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Check folder existence failed",
      };
    }
  }

  async renameFolder(options: RenameFolderOptions): Promise<RenameFolderResult> {
    try {
      // This is essentially a copy + delete operation for all files in the folder
      const oldPath = options.oldPath.endsWith("/") ? options.oldPath : `${options.oldPath}/`;
      const newPath = options.newPath.endsWith("/") ? options.newPath : `${options.newPath}/`;

      // List all objects in the old folder
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: oldPath,
      });

      const listResult = await this.client.send(listCommand);

      if (!listResult.Contents || listResult.Contents.length === 0) {
        return {
          success: true,
          movedFiles: [],
        };
      }

      const movedFiles: string[] = [];

      // Copy each file to new location and delete old one
      for (const obj of listResult.Contents) {
        const oldKey = obj.Key!;
        const newKey = oldKey.replace(oldPath, newPath);

        // Copy object using CopyObjectCommand
        const copyCommand = new CopyObjectCommand({
          Bucket: this.config.bucket,
          Key: newKey,
          CopySource: `${this.config.bucket}/${oldKey}`,
        });

        await this.client.send(copyCommand);
        movedFiles.push(newKey);
      }

      // Delete old folder contents
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: listResult.Contents.map((obj) => ({ Key: obj.Key! })),
          Quiet: true,
        },
      });

      await this.client.send(deleteCommand);

      return {
        success: true,
        movedFiles,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Rename folder failed",
      };
    }
  }

  async copyFolder(options: CopyFolderOptions): Promise<CopyFolderResult> {
    try {
      const sourcePath = options.sourcePath.endsWith("/")
        ? options.sourcePath
        : `${options.sourcePath}/`;
      const destPath = options.destinationPath.endsWith("/")
        ? options.destinationPath
        : `${options.destinationPath}/`;

      // List all objects in the source folder
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: sourcePath,
      });

      const listResult = await this.client.send(listCommand);

      if (!listResult.Contents || listResult.Contents.length === 0) {
        return {
          success: true,
          copiedFiles: [],
        };
      }

      const copiedFiles: string[] = [];

      // Copy each file to new location
      for (const obj of listResult.Contents) {
        const sourceKey = obj.Key!;
        const destKey = sourceKey.replace(sourcePath, destPath);

        // Copy object using CopyObjectCommand
        const copyCommand = new CopyObjectCommand({
          Bucket: this.config.bucket,
          Key: destKey,
          CopySource: `${this.config.bucket}/${sourceKey}`,
        });

        await this.client.send(copyCommand);
        copiedFiles.push(destKey);
      }

      return {
        success: true,
        copiedFiles,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Copy folder failed",
      };
    }
  }
}
