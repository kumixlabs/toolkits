/**
 * S3 file operations implementation
 * Provides comprehensive file management operations for S3-compatible storage providers
 */

import type { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
import { loadPresigner, loadS3Sdk } from "./s3-sdk";

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
      const { PutObjectCommand } = await loadS3Sdk();
      const contentType = options.contentType || getMimeType(options.key);

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: options.key,
        Body: options.file,
        ContentType: contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
        ContentDisposition: options.contentDisposition,
        // R2, MinIO, and Supabase reject canned ACLs. Only apply an ACL when the
        // caller explicitly set one AND the provider supports it (aws/digitalocean).
        ...(options.acl &&
        (this.config.provider === "aws" || this.config.provider === "digitalocean")
          ? { ACL: options.acl }
          : {}),
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
      const { GetObjectCommand } = await loadS3Sdk();
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
      const { DeleteObjectCommand } = await loadS3Sdk();
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
      const { DeleteObjectsCommand } = await loadS3Sdk();
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
        // Partial failures: S3 returns `result.Errors` for objects it could not
        // delete. Treat the operation as failed when any per-key error exists
        // so callers using `if (result.success)` don't silently miss that some
        // objects remain. The full per-key breakdown is still on `errors`/`deleted`.
        success: errors.length === 0,
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
      const { ListObjectsV2Command } = await loadS3Sdk();
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
      const { HeadObjectCommand } = await loadS3Sdk();
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
      const { CopyObjectCommand } = await loadS3Sdk();
      const command = new CopyObjectCommand({
        Bucket: this.config.bucket,
        // CopySource must be percent-encoded; keys containing `?`, `&`, `=`,
        // `+`, spaces, or non-ASCII would otherwise break the copy request.
        // Encode each path segment so `/` separators survive while reserved
        // chars within a segment are escaped.
        CopySource: `${this.config.bucket}/${options.sourceKey.split("/").map(encodeURIComponent).join("/")}`,
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
      const { GetObjectCommand, PutObjectCommand } = await loadS3Sdk();
      const { getSignedUrl } = await loadPresigner();
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

    // MinIO is self-hosted and does not expose objects at the AWS URL format —
    // synthesizing one would just produce a 404 the caller can't distinguish
    // from a real miss. Surface the misconfiguration explicitly instead.
    if (this.config.provider === "minio") {
      throw new Error(
        "MinIO public URL could not be built: set `publicUrl` (or `endpoint`) on the S3 config " +
          "to a publicly reachable base, since MinIO has no default public host.",
      );
    }

    // Default AWS / DigitalOcean Spaces URL format. Encode each key segment so
    // keys containing spaces/special chars yield valid URLs (matching the
    // percent-encoding used by `copy`/`renameFolder`), while `/` separators are
    // preserved.
    const encodedKey = key.split("/").map(encodeURIComponent).join("/");
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${encodedKey}`;
  }
}
