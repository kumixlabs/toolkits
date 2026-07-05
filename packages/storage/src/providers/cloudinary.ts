/**
 * Cloudinary storage provider implementation
 * Provides cloud storage operations using Cloudinary's API for media management
 */

import { v2 as cloudinary } from "cloudinary";

import type {
  BatchDeleteOptions,
  BatchDeleteResult,
  CloudinaryConfig,
  CopyFolderOptions,
  CopyFolderResult,
  CopyOptions,
  CopyResult,
  CreateFolderOptions,
  CreateFolderResult,
  DeleteFolderOptions,
  DeleteFolderResult,
  DeleteOptions,
  DeleteResult,
  DownloadOptions,
  DownloadResult,
  DuplicateOptions,
  DuplicateResult,
  ExistsResult,
  FolderExistsResult,
  ListFoldersOptions,
  ListFoldersResult,
  ListOptions,
  ListResult,
  MoveOptions,
  MoveResult,
  PresignedUrlOptions,
  PresignedUrlResult,
  RenameFolderOptions,
  RenameFolderResult,
  StorageInterface,
  UploadOptions,
  UploadResult,
} from "../types";

/**
 * Cloudinary storage provider
 * Implements StorageInterface for Cloudinary cloud storage
 * @internal
 */
export class CloudinaryProvider implements StorageInterface {
  private config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    this.config = config;

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: config.secure !== false,
    });
  }

  // File operations
  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      // Convert Buffer/Uint8Array to base64 for Cloudinary
      let fileData: string;
      if (typeof options.file === "string") {
        fileData = options.file;
      } else {
        fileData = `data:${options.contentType || "application/octet-stream"};base64,${Buffer.from(options.file).toString("base64")}`;
      }

      // Determine resource type based on content type
      let resourceType: "image" | "video" | "raw" = "raw";
      if (options.contentType?.startsWith("image/")) {
        resourceType = "image";
      } else if (options.contentType?.startsWith("video/")) {
        resourceType = "video";
      }

      // Extract folder and filename from key for Cloudinary folder support
      const keyParts = options.key.split("/");
      let folder = "";
      let publicId = keyParts[keyParts.length - 1];

      if (keyParts.length > 1) {
        folder = keyParts.slice(0, -1).join("/");
      }

      const dotIndex = publicId.lastIndexOf(".");
      if (dotIndex > 0) {
        publicId = publicId.slice(0, dotIndex);
      }

      const uploadOptions: Record<string, unknown> = {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        invalidate: true,
        ...options.metadata,
      };

      // Add folder if extracted from key
      if (folder) {
        uploadOptions.folder = folder;
      }

      // Add folder if enabled in config
      if (this.config.folder) {
        uploadOptions.folder = `${this.config.folder}/${folder}`;
      }

      const result = await cloudinary.uploader.upload(fileData, uploadOptions);

      // Sample result structure
      // {
      //   asset_id: 'b4033628c0897843e61e362167f338d6',
      //   public_id: 'starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30',
      //   version: 1765965394,
      //   version_id: 'abd49804c49061cef406f8d703466849',
      //   signature: 'ff52169a483bada7ca4943ce322132137bec4d2f',
      //   width: 256,
      //   height: 256,
      //   format: 'png',
      //   resource_type: 'image',
      //   created_at: '2025-12-17T09:52:12Z',
      //   tags: [],
      //   bytes: 76429,
      //   type: 'upload',
      //   etag: '85e34db0ea9ce8e771e25bd8eb33ba56',
      //   placeholder: false,
      //   url: 'http://res.cloudinary.com/droen5ejq/image/upload/v1765965394/starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30.png',
      //   secure_url: 'https://res.cloudinary.com/droen5ejq/image/upload/v1765965394/starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30.png',
      //   asset_folder: 'starter/workspaces/logo',
      //   display_name: 'ws_1KBQ2V0VRKK5EN936G8S2XZ30',
      //   overwritten: true,
      //   api_key: '255239588173378'
      // }

      const publicUrl = this.getPublicUrl(result.public_id, result.format);

      return {
        success: true,
        key: result.public_id,
        url: result.secure_url,
        publicUrl,
        etag: result.etag,
        size: result.bytes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    try {
      // Cloudinary doesn't support direct download like S3
      // We need to fetch from the public URL
      const publicUrl = this.getPublicUrl(options.key);

      const response = await fetch(publicUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to download: ${response.status} ${response.statusText}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);

      return {
        success: true,
        content, // Main content field
        data: content, // Alias for backward compatibility
        contentType: response.headers.get("content-type") || undefined,
        contentLength: content.length,
        lastModified: response.headers.get("last-modified")
          ? new Date(response.headers.get("last-modified")!)
          : new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    try {
      // Extract folder and filename for proper deletion
      const keyParts = options.key.split("/");
      let publicId = options.key;

      if (keyParts.length > 1) {
        const folder = keyParts.slice(0, -1).join("/");
        const filename = keyParts[keyParts.length - 1];
        publicId = `${folder}/${filename}`;
      }

      const dotIndex = publicId.lastIndexOf(".");
      if (dotIndex > 0) {
        publicId = publicId.slice(0, dotIndex);
      }

      // Add folder if enabled in config
      if (this.config.folder) {
        publicId = `${this.config.folder}/${publicId}`;
      }

      // Determine resource type from key/path
      let resourceType: "image" | "video" | "raw" = "raw";

      // Try to get resource info first to determine type
      try {
        await cloudinary.api.resource(publicId, { resource_type: "image" });
        resourceType = "image";
      } catch {
        try {
          await cloudinary.api.resource(publicId, { resource_type: "video" });
          resourceType = "video";
        } catch {
          resourceType = "raw";
        }
      }

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }

  async batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult> {
    try {
      // Use Cloudinary Admin API for batch delete
      return {
        success: false,
        errors: options.keys.map((key) => ({
          key,
          error: "Cloudinary batch delete not implemented yet",
        })),
      };
    } catch (error) {
      return {
        success: false,
        errors: options.keys.map((key) => ({
          key,
          error: error instanceof Error ? error.message : "Batch delete failed",
        })),
      };
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    try {
      const prefix = options.prefix || "";
      const maxResults = options.maxKeys || 50;

      // List all resource types
      const [images, videos, rawFiles] = await Promise.all([
        cloudinary.api
          .resources({
            type: "upload",
            resource_type: "image",
            prefix,
            max_results: maxResults,
            next_cursor: options.continuationToken,
          })
          .catch(() => ({ resources: [], next_cursor: undefined })),

        cloudinary.api
          .resources({
            type: "upload",
            resource_type: "video",
            prefix,
            max_results: maxResults,
            next_cursor: options.continuationToken,
          })
          .catch(() => ({ resources: [], next_cursor: undefined })),

        cloudinary.api
          .resources({
            type: "upload",
            resource_type: "raw",
            prefix,
            max_results: maxResults,
            next_cursor: options.continuationToken,
          })
          .catch(() => ({ resources: [], next_cursor: undefined })),
      ]);

      const allResources = [
        ...(images.resources || []),
        ...(videos.resources || []),
        ...(rawFiles.resources || []),
      ];

      const files = allResources.map((resource: Record<string, unknown>) => ({
        key: String(resource.public_id || ""),
        size: Number(resource.bytes) || 0,
        lastModified: new Date(String(resource.created_at || new Date())),
        etag: String(resource.etag || ""),
        contentType: resource.format
          ? `${resource.resource_type}/${resource.format}`
          : "application/octet-stream",
      }));

      return {
        success: true,
        files,
        isTruncated: !!(images.next_cursor || videos.next_cursor || rawFiles.next_cursor),
        nextContinuationToken: images.next_cursor || videos.next_cursor || rawFiles.next_cursor,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List failed",
      };
    }
  }

  async exists(_key: string): Promise<ExistsResult> {
    try {
      // Use Cloudinary Admin API to check if resource exists
      return {
        exists: false,
        error: "Cloudinary exists check not implemented yet",
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Check existence failed",
      };
    }
  }

  async copy(_options: CopyOptions): Promise<CopyResult> {
    try {
      // Cloudinary doesn't have direct copy, would need to download and re-upload
      return {
        success: false,
        error: "Cloudinary copy not implemented yet",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Copy failed",
      };
    }
  }

  async move(_options: MoveOptions): Promise<MoveResult> {
    try {
      // Use Cloudinary Admin API to rename/move
      return {
        success: false,
        error: "Cloudinary move not implemented yet",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Move failed",
      };
    }
  }

  async duplicate(options: DuplicateOptions): Promise<DuplicateResult> {
    // Duplicate is just an alias for copy
    return this.copy(options);
  }

  async getPresignedUrl(_options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    try {
      // Cloudinary uses different approach - signed URLs
      return {
        success: false,
        error: "Cloudinary presigned URL not implemented yet",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Presigned URL generation failed",
      };
    }
  }

  getPublicUrl(key: string, extension?: string): string {
    // Generate Cloudinary URL
    const protocol = this.config.secure !== false ? "https" : "http";
    const baseUrl = `${protocol}://res.cloudinary.com/${this.config.cloudName}`;

    // Use key directly as public ID - folder structure comes from the key itself
    const publicId = key;

    // For images: /image/upload/v1234567890/sample.jpg
    // For videos: /video/upload/v1234567890/sample.mp4
    // For raw files: /raw/upload/v1234567890/sample.pdf

    // Default to image for now, in real implementation you'd detect file type
    return `${baseUrl}/image/upload/${publicId}${extension ? `.${extension}` : ""}`;
  }

  // Folder operations
  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    try {
      // Cloudinary folders are created implicitly when uploading files
      return {
        success: true,
        path: options.path,
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
      // Cloudinary requires deleting all assets in folder first
      // Then delete the folder itself
      const folderPath = options.path.endsWith("/") ? options.path.slice(0, -1) : options.path;

      if (options.recursive) {
        // Delete all resources in the folder
        await cloudinary.api.delete_resources_by_prefix(folderPath);
      }

      // Delete the folder
      await cloudinary.api.delete_folder(folderPath);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete folder failed",
      };
    }
  }

  async listFolders(_options?: ListFoldersOptions): Promise<ListFoldersResult> {
    try {
      // Use Cloudinary Admin API to list folders
      const result = await cloudinary.api.root_folders();

      const folders = (result.folders || []).map((folder: Record<string, unknown>) => ({
        name: folder.name,
        path: folder.path,
      }));

      return {
        success: true,
        folders,
        isTruncated: false,
        nextContinuationToken: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List folders failed",
      };
    }
  }

  async folderExists(_path: string): Promise<FolderExistsResult> {
    try {
      // Check if folder exists in Cloudinary
      return {
        exists: false,
        error: "Cloudinary folder exists check not implemented yet",
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Check folder existence failed",
      };
    }
  }

  async renameFolder(_options: RenameFolderOptions): Promise<RenameFolderResult> {
    try {
      // Cloudinary folder rename would require moving all assets
      return {
        success: false,
        error: "Cloudinary rename folder not implemented yet",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Rename folder failed",
      };
    }
  }

  async copyFolder(_options: CopyFolderOptions): Promise<CopyFolderResult> {
    try {
      // Cloudinary folder copy would require copying all assets
      return {
        success: false,
        error: "Cloudinary copy folder not implemented yet",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Copy folder failed",
      };
    }
  }
}
