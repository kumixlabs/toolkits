/**
 * File operation types and interfaces
 * Defines types for file upload, download, delete, copy, move, and other file operations
 */

import type { FileInfo } from "./base";

// File upload options
export interface UploadOptions {
  key: string;
  file: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  acl?: "private" | "public-read" | "public-read-write";
  expires?: Date;
}

// File upload result
export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  publicUrl?: string;
  etag?: string;
  size?: number;
  error?: string;
}

// File download options
export interface DownloadOptions {
  key: string;
  range?: string; // For partial downloads
}

// File download result
export interface DownloadResult {
  success: boolean;
  content?: Buffer; // Main content field
  data?: Buffer; // Alias for backward compatibility
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  metadata?: Record<string, string>;
  error?: string;
}

// Delete options
export interface DeleteOptions {
  key: string;
}

// Delete result
export interface DeleteResult {
  success: boolean;
  error?: string;
}

// Batch delete options
export interface BatchDeleteOptions {
  keys: string[];
}

// Batch delete result
export interface BatchDeleteResult {
  success: boolean;
  deleted?: string[];
  errors?: Array<{
    key: string;
    error: string;
  }>;
}

// Copy options
export interface CopyOptions {
  sourceKey: string;
  destinationKey: string;
  metadata?: Record<string, string>;
  metadataDirective?: "COPY" | "REPLACE";
}

// Copy result
export interface CopyResult {
  success: boolean;
  etag?: string;
  error?: string;
}

// Move/Rename options
export interface MoveOptions {
  sourceKey: string;
  destinationKey: string;
  metadata?: Record<string, string>;
  metadataDirective?: "COPY" | "REPLACE";
}

// Move/Rename result
export interface MoveResult {
  success: boolean;
  etag?: string;
  error?: string;
}

// Duplicate options (alias for copy)
export type DuplicateOptions = CopyOptions;

// Duplicate result (alias for copy)
export type DuplicateResult = CopyResult;

// File exists result
export interface ExistsResult {
  exists: boolean;
  fileInfo?: FileInfo;
  error?: string;
}

// List files options
export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

// List files result
export interface ListResult {
  success: boolean;
  files?: FileInfo[];
  isTruncated?: boolean;
  nextContinuationToken?: string;
  commonPrefixes?: string[];
  error?: string;
}

// Presigned URL options
export interface PresignedUrlOptions {
  key: string;
  operation: "get" | "put";
  expiresIn?: number; // seconds, default 3600 (1 hour)
  contentType?: string; // For PUT operations
}

// Presigned URL result
export interface PresignedUrlResult {
  success: boolean;
  url?: string;
  expiresAt?: Date;
  error?: string;
}
