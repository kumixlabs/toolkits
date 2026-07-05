/**
 * Base storage types and configurations
 * Defines core types for storage providers, configurations, and file information
 */

/**
 * S3-compatible provider types
 * @public
 */
export type S3ProviderType =
  | "aws"
  | "cloudflare-r2"
  | "minio"
  | "digitalocean"
  | "supabase"
  | "custom";

/**
 * All supported storage provider types
 * @public
 */
export type StorageProvider = S3ProviderType | "cloudinary";

/**
 * Union type for all storage configurations
 * @public
 */
export type StorageConfig = S3Config | CloudinaryConfig;

/**
 * S3-compatible storage configuration
 * @public
 */
export interface S3Config {
  /** S3-compatible provider type */
  provider: S3ProviderType;
  /** AWS region or provider-specific region */
  region: string;
  /** Bucket name */
  bucket: string;
  /** Access key ID for authentication */
  accessKeyId: string;
  /** Secret access key for authentication */
  secretAccessKey: string;
  /** Custom endpoint for S3-compatible services (MinIO, R2, etc.) */
  endpoint?: string;
  /** Force path style for services like MinIO */
  forcePathStyle?: boolean;
  /** Base URL for public access (CDN, custom domain) */
  publicUrl?: string;
}

/**
 * Cloudinary storage configuration
 * @public
 */
export interface CloudinaryConfig {
  /** Provider type (always 'cloudinary') */
  provider: "cloudinary";
  /** Cloudinary cloud name */
  cloudName: string;
  /** Cloudinary API key */
  apiKey: string;
  /** Cloudinary API secret */
  apiSecret: string;
  /** Use HTTPS for URLs (default: true) */
  secure?: boolean;
  /** Default upload folder */
  folder?: string;
}

/**
 * File information structure
 * @public
 */
export interface FileInfo {
  /** File key/path */
  key: string;
  /** File size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** Entity tag for caching */
  etag: string;
  /** MIME content type */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Folder information structure
 * @public
 */
export interface FolderInfo {
  /** Folder name */
  name: string;
  /** Full folder path */
  path: string;
  /** Total size of all files in folder */
  size: number;
  /** Number of files in folder */
  fileCount: number;
  /** Last modified date */
  lastModified: Date;
}
