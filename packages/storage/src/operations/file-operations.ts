/**
 * S3 file operations implementation
 * Provides comprehensive file management operations for S3-compatible storage providers
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { buildPublicUrl, getMimeType } from "../helpers";
import type {
  BatchDeleteOptions,
  BatchDeleteResult,
  CopyOptions,
  CopyResult,
  DeleteOptions,
  DeleteResult,
  DownloadOptions,
  DownloadResult,
  DuplicateOptions,
  DuplicateResult,
  ExistsResult,
  FileInfo,
  ListOptions,
  ListResult,
  MoveOptions,
  MoveResult,
  PresignedUrlOptions,
  PresignedUrlResult,
  S3Config,
  UploadOptions,
  UploadResult,
} from "../types";

/**
 * S3 file operations implementation
 * Handles all file-related operations for S3-compatible storage providers
 * @internal
 */
export class FileOperations {
  constructor(
    private client: S3Client,
    private config: S3Config,
  ) {}

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const contentType = options.contentType || getMimeType(options.key);

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: options.key,
        Body: options.file,
        ContentType: contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
        ContentDisposition: options.contentDisposition,
        ACL: options.acl,
        Expires: options.expires,
      });

      const result = await this.client.send(command);

      const publicUrl = this.getPublicUrl(options.key);

      return {
        success: true,
        key: options.key,
        url: publicUrl,
        publicUrl,
        etag: result.ETag?.replace(/"/g, ""),
        size:
          typeof options.file === "string"
            ? Buffer.byteLength(options.file, "utf8")
            : options.file.length,
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
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: options.key,
        Range: options.range,
      });

      const result = await this.client.send(command);

      if (!result.Body) {
        return {
          success: false,
          error: "No data received",
        };
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = result.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const data = Buffer.concat(chunks);

      return {
        success: true,
        content: data, // Main content field
        data, // Alias for backward compatibility
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag?.replace(/"/g, ""),
        metadata: result.Metadata,
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
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: options.key,
      });

      await this.client.send(command);

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
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: options.keys.map((key) => ({ Key: key })),
          Quiet: false,
        },
      });

      const result = await this.client.send(command);

      const deleted = result.Deleted?.map((obj) => obj.Key).filter(Boolean) as string[];
      const errors =
        result.Errors?.map((err) => ({
          key: err.Key || "",
          error: err.Message || "Unknown error",
        })) || [];

      return {
        success: true,
        deleted,
        errors: errors.length > 0 ? errors : undefined,
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
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: options.prefix,
        Delimiter: options.delimiter,
        MaxKeys: options.maxKeys,
        ContinuationToken: options.continuationToken,
      });

      const result = await this.client.send(command);

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
        files,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken,
        commonPrefixes: result.CommonPrefixes?.map((cp) => cp.Prefix!),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List failed",
      };
    }
  }

  async exists(key: string): Promise<ExistsResult> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const result = await this.client.send(command);

      return {
        exists: true,
        fileInfo: {
          key,
          size: result.ContentLength || 0,
          lastModified: result.LastModified || new Date(),
          etag: result.ETag?.replace(/"/g, "") || "",
          contentType: result.ContentType,
          metadata: result.Metadata,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "NotFound") {
        return { exists: false };
      }

      return {
        exists: false,
        error: error instanceof Error ? error.message : "Check existence failed",
      };
    }
  }

  async copy(options: CopyOptions): Promise<CopyResult> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${options.sourceKey}`,
        Key: options.destinationKey,
        Metadata: options.metadata,
        MetadataDirective: options.metadataDirective || "COPY",
      });

      const result = await this.client.send(command);

      return {
        success: true,
        etag: result.CopyObjectResult?.ETag?.replace(/"/g, ""),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Copy failed",
      };
    }
  }

  async move(options: MoveOptions): Promise<MoveResult> {
    try {
      // First copy the object
      const copyResult = await this.copy({
        sourceKey: options.sourceKey,
        destinationKey: options.destinationKey,
        metadata: options.metadata,
        metadataDirective: options.metadataDirective,
      });

      if (!copyResult.success) {
        return {
          success: false,
          error: copyResult.error || "Move failed during copy operation",
        };
      }

      // Then delete the source object
      const deleteResult = await this.delete({ key: options.sourceKey });

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error || "Move failed during delete operation",
        };
      }

      return {
        success: true,
        etag: copyResult.etag,
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

  async getPresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    try {
      const expiresIn = options.expiresIn || 3600; // 1 hour default

      let command: GetObjectCommand | PutObjectCommand;
      if (options.operation === "get") {
        command = new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: options.key,
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: options.key,
          ContentType: options.contentType,
        });
      }

      const url = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      return {
        success: true,
        url,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Presigned URL generation failed",
      };
    }
  }

  getPublicUrl(key: string): string {
    const isCloudflare = this.config.provider === "cloudflare-r2";
    const isSupabase = this.config.provider === "supabase";

    if (this.config.publicUrl) {
      return buildPublicUrl(
        this.config.publicUrl,
        isCloudflare ? "" : this.config.bucket,
        key,
        isSupabase,
      );
    }

    if (this.config.endpoint) {
      return buildPublicUrl(this.config.endpoint, this.config.bucket, key, isSupabase);
    }

    // Default AWS S3 URL format
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}
