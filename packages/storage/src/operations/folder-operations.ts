/**
 * S3 folder operations implementation
 * Provides comprehensive folder management operations for S3-compatible storage providers
 */

import {
  type _Object,
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

/** S3 DeleteObjectsCommand allows at most 1000 keys per request */
const S3_DELETE_MAX_KEYS = 1000;

/**
 * List ALL objects under a prefix, following pagination (handles >1000 keys)
 */
async function listAllObjects(
  client: S3Client,
  bucket: string,
  prefix: string,
): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;
  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const result = await client.send(command);
    if (result.Contents) {
      objects.push(...result.Contents);
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

/** Delete objects in batches of 1000 (S3 hard limit per DeleteObjectsCommand) */
async function deleteObjectsBatched(
  client: S3Client,
  bucket: string,
  keys: string[],
): Promise<string[]> {
  const deleted: string[] = [];
  for (let i = 0; i < keys.length; i += S3_DELETE_MAX_KEYS) {
    const batch = keys.slice(i, i + S3_DELETE_MAX_KEYS);
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: batch.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });
    const result = await client.send(command);
    if (result.Deleted) {
      for (const obj of result.Deleted) {
        if (obj.Key) deleted.push(obj.Key);
      }
    }
  }
  return deleted;
}

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
        // List all objects with the folder prefix (handles >1000 keys)
        const allObjects = await listAllObjects(this.client, this.config.bucket, folderPath);

        if (allObjects.length === 0) {
          return {
            success: true,
            deletedFiles: [],
          };
        }

        // Delete all objects in batches of 1000
        const keys = allObjects.map((obj) => obj.Key!).filter(Boolean);
        const deletedFiles = await deleteObjectsBatched(this.client, this.config.bucket, keys);

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

      // List all objects in the old folder (handles >1000 keys)
      const allObjects = await listAllObjects(this.client, this.config.bucket, oldPath);

      if (allObjects.length === 0) {
        return {
          success: true,
          movedFiles: [],
        };
      }

      const movedFiles: string[] = [];

      // Copy each file to new location
      for (const obj of allObjects) {
        const oldKey = obj.Key!;
        // Anchor the prefix substitution to the start of the key. `String.replace`
        // replaces the first occurrence *anywhere*, which over-replaces when the
        // path segment also appears mid-key.
        const newKey = newPath + oldKey.slice(oldPath.length);

        // Copy object using CopyObjectCommand
        const copyCommand = new CopyObjectCommand({
          Bucket: this.config.bucket,
          Key: newKey,
          // CopySource must be percent-encoded; keys with special chars break the
          // copy request otherwise.
          CopySource: `${this.config.bucket}/${oldKey.split("/").map(encodeURIComponent).join("/")}`,
        });

        await this.client.send(copyCommand);
        movedFiles.push(newKey);
      }

      // Delete old folder contents in batches
      const oldKeys = allObjects.map((obj) => obj.Key!).filter(Boolean);
      await deleteObjectsBatched(this.client, this.config.bucket, oldKeys);

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

      // List all objects in the source folder (handles >1000 keys).
      // Non-recursive filtering is applied per-object below (the list call is
      // identical either way — the previous ternary was dead code).
      const allObjects = await listAllObjects(this.client, this.config.bucket, sourcePath);

      if (allObjects.length === 0) {
        return {
          success: true,
          copiedFiles: [],
        };
      }

      const copiedFiles: string[] = [];

      // Copy each file to new location
      for (const obj of allObjects) {
        const sourceKey = obj.Key!;
        // When not recursive, skip nested objects (files in subfolders)
        if (!options.recursive) {
          const relativeKey = sourceKey.slice(sourcePath.length);
          if (relativeKey.includes("/")) continue;
        }
        // Anchor the prefix substitution to the start of the key.
        const destKey = destPath + sourceKey.slice(sourcePath.length);

        // Copy object using CopyObjectCommand
        const copyCommand = new CopyObjectCommand({
          Bucket: this.config.bucket,
          Key: destKey,
          // CopySource must be percent-encoded.
          CopySource: `${this.config.bucket}/${sourceKey.split("/").map(encodeURIComponent).join("/")}`,
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
