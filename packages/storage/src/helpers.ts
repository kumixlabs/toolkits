/**
 * Storage helper utilities
 * Provides utility functions for file operations, MIME type detection, and path manipulation
 */

import { lookup } from "mime-types";

/**
 * Generate a unique file key with timestamp and random string
 * @param originalName Original file name
 * @param prefix Optional prefix for the key
 * @returns Unique file key
 * @public
 *
 * @example
 * ```typescript
 * import { generateFileKey } from '@kumix/storage/helpers';
 *
 * const key1 = generateFileKey('document.pdf');
 * // Returns: "document-1703123456789-abc123.pdf"
 *
 * const key2 = generateFileKey('photo.jpg', 'uploads/images');
 * // Returns: "uploads/images/photo-1703123456789-def456.jpg"
 * ```
 */
export function generateFileKey(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const baseName = originalName.split(".").slice(0, -1).join(".");

  const fileName = `${baseName}-${timestamp}-${random}${extension ? `.${extension}` : ""}`;

  return prefix ? `${prefix}/${fileName}` : fileName;
}

/**
 * Get MIME type from file name or extension
 * @param fileName File name or path
 * @returns MIME type string
 * @public
 *
 * @example
 * ```typescript
 * import { getMimeType } from '@kumix/storage/helpers';
 *
 * const type1 = getMimeType('document.pdf');
 * // Returns: "application/pdf"
 *
 * const type2 = getMimeType('photo.jpg');
 * // Returns: "image/jpeg"
 *
 * const type3 = getMimeType('unknown.xyz');
 * // Returns: "application/octet-stream"
 * ```
 */
export function getMimeType(fileName: string): string {
  const mimeType = lookup(fileName);
  return mimeType || "application/octet-stream";
}

/**
 * Validate file size against maximum allowed size
 * @param fileSize File size in bytes
 * @param maxSize Maximum allowed size in bytes
 * @returns Validation result with error message if invalid
 * @public
 *
 * @example
 * ```typescript
 * import { validateFileSize } from '@kumix/storage/helpers';
 *
 * const result1 = validateFileSize(1024 * 1024, 5 * 1024 * 1024); // 1MB vs 5MB limit
 * // Returns: { valid: true }
 *
 * const result2 = validateFileSize(10 * 1024 * 1024, 5 * 1024 * 1024); // 10MB vs 5MB limit
 * // Returns: { valid: false, error: "File size 10 MB exceeds maximum allowed size 5 MB" }
 * ```
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number,
): { valid: boolean; error?: string } {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size ${formatFileSize(fileSize)} exceeds maximum allowed size ${formatFileSize(maxSize)}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file type against allowed types (MIME types or extensions)
 * @param fileName File name or path
 * @param allowedTypes Array of allowed MIME types or file extensions
 * @returns Validation result with error message if invalid
 * @public
 *
 * @example
 * ```typescript
 * import { validateFileType } from '@kumix/storage/helpers';
 *
 * // Using MIME types
 * const result1 = validateFileType('photo.jpg', ['image/*', 'application/pdf']);
 * // Returns: { valid: true }
 *
 * // Using file extensions
 * const result2 = validateFileType('document.txt', ['.pdf', '.doc', '.docx']);
 * // Returns: { valid: false, error: "File type not allowed. Allowed types: .pdf, .doc, .docx" }
 *
 * // Mixed MIME types and extensions
 * const result3 = validateFileType('video.mp4', ['image/*', '.pdf', 'video/mp4']);
 * // Returns: { valid: true }
 * ```
 */
export function validateFileType(
  fileName: string,
  allowedTypes: string[],
): { valid: boolean; error?: string } {
  const mimeType = getMimeType(fileName);
  const extension = fileName.split(".").pop()?.toLowerCase();

  const isValidMime = allowedTypes.some((type) => {
    if (type.includes("*")) {
      const baseType = type.split("/")[0];
      return mimeType.startsWith(baseType);
    }
    return mimeType === type;
  });

  const isValidExtension = extension && allowedTypes.includes(`.${extension}`);

  if (!isValidMime && !isValidExtension) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Format file size in human readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 * @public
 *
 * @example
 * ```typescript
 * import { formatFileSize } from '@kumix/storage/helpers';
 *
 * const size1 = formatFileSize(1024);
 * // Returns: "1 KB"
 *
 * const size2 = formatFileSize(1048576);
 * // Returns: "1 MB"
 *
 * const size3 = formatFileSize(1073741824);
 * // Returns: "1 GB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sanitize file name for S3 key by removing special characters
 * @param fileName Original file name
 * @returns Sanitized file name safe for S3 keys
 * @public
 *
 * @example
 * ```typescript
 * import { sanitizeFileName } from '@kumix/storage/helpers';
 *
 * const safe1 = sanitizeFileName('My Document (2023).pdf');
 * // Returns: "my_document_2023.pdf"
 *
 * const safe2 = sanitizeFileName('file@#$%name.txt');
 * // Returns: "file_name.txt"
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * Extract file extension from file name
 * @param fileName File name or path
 * @returns File extension with dot (e.g., '.pdf')
 * @public
 *
 * @example
 * ```typescript
 * import { getFileExtension } from '@kumix/storage/helpers';
 *
 * const ext1 = getFileExtension('document.pdf');
 * // Returns: ".pdf"
 *
 * const ext2 = getFileExtension('photo.JPEG');
 * // Returns: ".jpeg"
 *
 * const ext3 = getFileExtension('noextension');
 * // Returns: ""
 * ```
 */
export function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop();
  return extension ? `.${extension.toLowerCase()}` : "";
}

/**
 * Generate cache control header for HTTP responses
 * @param maxAge Cache max age in seconds (default: 1 year)
 * @param isPublic Whether cache should be public or private
 * @returns Cache control header string
 * @public
 *
 * @example
 * ```typescript
 * import { generateCacheControl } from '@kumix/storage/helpers';
 *
 * const cache1 = generateCacheControl();
 * // Returns: "public, max-age=31536000"
 *
 * const cache2 = generateCacheControl(3600, false);
 * // Returns: "private, max-age=3600"
 *
 * const cache3 = generateCacheControl(86400); // 1 day
 * // Returns: "public, max-age=86400"
 * ```
 */
export function generateCacheControl(
  maxAge: number = 31536000, // 1 year default
  isPublic: boolean = true,
): string {
  const visibility = isPublic ? "public" : "private";
  return `${visibility}, max-age=${maxAge}`;
}

/**
 * Parse S3 URL to extract bucket and key
 * @param url S3 URL to parse
 * @returns Object containing bucket and key
 * @public
 *
 * @example
 * ```typescript
 * import { parseS3Url } from '@kumix/storage/helpers';
 *
 * // Virtual hosted-style URL
 * const result1 = parseS3Url('https://my-bucket.s3.us-east-1.amazonaws.com/folder/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "folder/file.pdf" }
 *
 * // Path-style URL
 * const result2 = parseS3Url('https://s3.us-east-1.amazonaws.com/my-bucket/folder/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "folder/file.pdf" }
 *
 * // Custom endpoint (R2, MinIO)
 * const result3 = parseS3Url('https://my-endpoint.com/my-bucket/folder/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "folder/file.pdf" }
 * ```
 */
export function parseS3Url(url: string): { bucket?: string; key?: string } {
  try {
    const urlObj = new URL(url);

    // Handle different S3 URL formats
    if (urlObj.hostname.includes("amazonaws.com")) {
      // Virtual hosted-style: https://bucket.s3.region.amazonaws.com/key
      if (urlObj.hostname.startsWith("s3")) {
        // Path-style: https://s3.region.amazonaws.com/bucket/key
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        return {
          bucket: pathParts[0],
          key: pathParts.slice(1).join("/"),
        };
      } else {
        // Virtual hosted-style
        const bucket = urlObj.hostname.split(".")[0];
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return { bucket, key };
      }
    }

    // Custom endpoint (like R2, MinIO)
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    return {
      bucket: pathParts[0],
      key: pathParts.slice(1).join("/"),
    };
  } catch {
    return {};
  }
}

/**
 * Build public URL for a file
 * @param baseUrl Base URL of the storage service
 * @param bucket Bucket name
 * @param key File key/path
 * @returns Complete public URL
 * @public
 *
 * @example
 * ```typescript
 * import { buildPublicUrl } from '@kumix/storage/helpers';
 *
 * const url1 = buildPublicUrl('https://cdn.example.com', 'my-bucket', 'folder/file.pdf');
 * // Returns: "https://cdn.example.com/my-bucket/folder/file.pdf"
 *
 * const url2 = buildPublicUrl('https://storage.example.com/', 'assets', 'images/logo.png');
 * // Returns: "https://storage.example.com/assets/images/logo.png"
 * ```
 */
export function buildPublicUrl(
  baseUrl: string,
  bucket: string,
  key: string,
  supabase?: boolean,
): string {
  let cleanBaseUrl: string;

  cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const cleanKey = key.replace(/^\//, "");

  if (supabase) {
    // Remove both `.storage` subdomain and S3 path
    cleanBaseUrl = cleanBaseUrl
      .replace(/\.storage/, "") // remove ".storage"
      .replace(/\/storage\/v1\/s3$/, ""); // remove "/storage/v1/s3"
    cleanBaseUrl = `${cleanBaseUrl}/storage/v1/object/public`;
  }

  return `${cleanBaseUrl}/${bucket === "" ? "" : `${bucket}/`}${cleanKey}`;
}

/**
 * Validate S3 key format according to AWS S3 naming rules
 * @param key S3 object key to validate
 * @returns Validation result with error message if invalid
 * @public
 *
 * @example
 * ```typescript
 * import { validateS3Key } from '@kumix/storage/helpers';
 *
 * const result1 = validateS3Key('documents/report.pdf');
 * // Returns: { valid: true }
 *
 * const result2 = validateS3Key('/invalid/key/');
 * // Returns: { valid: false, error: "Key cannot start or end with forward slash" }
 * ```
 */
export function validateS3Key(key: string): { valid: boolean; error?: string } {
  if (!key || key.length === 0) {
    return { valid: false, error: "Key cannot be empty" };
  }

  if (key.length > 1024) {
    return { valid: false, error: "Key cannot exceed 1024 characters" };
  }

  if (key.startsWith("/") || key.endsWith("/")) {
    return {
      valid: false,
      error: "Key cannot start or end with forward slash",
    };
  }

  // Check for invalid characters
  const invalidChars = /[^\w\-_./]/;
  if (invalidChars.test(key)) {
    return { valid: false, error: "Key contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Convert File object to Buffer for upload
 * @param file File object from browser input
 * @returns Promise that resolves to Buffer
 * @public
 *
 * @example
 * ```typescript
 * import { fileToBuffer } from '@kumix/storage/helpers';
 *
 * // In browser with file input
 * const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
 * const file = fileInput.files?.[0];
 *
 * if (file) {
 *   const buffer = await fileToBuffer(file);
 *   // Use buffer for upload
 *   await storage.uploadFile('uploads/file.pdf', buffer);
 * }
 * ```
 */
export async function fileToBuffer(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Get file information from File object
 * @param file File object from browser input
 * @returns Object containing file metadata
 * @public
 *
 * @example
 * ```typescript
 * import { getFileInfo } from '@kumix/storage/helpers';
 *
 * // In browser with file input
 * const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
 * const file = fileInput.files?.[0];
 *
 * if (file) {
 *   const info = getFileInfo(file);
 *   console.log(info);
 *   // Returns: {
 *   //   name: "document.pdf",
 *   //   size: 1048576,
 *   //   type: "application/pdf",
 *   //   lastModified: Date
 *   // }
 * }
 * ```
 */
export function getFileInfo(file: File): {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
} {
  return {
    name: file.name,
    size: file.size,
    type: file.type || getMimeType(file.name),
    lastModified: new Date(file.lastModified),
  };
}

/**
 * Generate unique key with prefix and timestamp
 * @param fileName Original file name
 * @param prefix Optional prefix for the key
 * @param includeTimestamp Whether to include timestamp for uniqueness
 * @returns Unique file key
 * @public
 *
 * @example
 * ```typescript
 * import { generateUniqueKey } from '@kumix/storage/helpers';
 *
 * const key1 = generateUniqueKey('report.pdf', 'documents');
 * // Returns: "documents/report-1703123456789-abc123.pdf"
 *
 * const key2 = generateUniqueKey('photo.jpg', 'images', false);
 * // Returns: "images/photo.jpg"
 * ```
 */
export function generateUniqueKey(
  fileName: string,
  prefix?: string,
  includeTimestamp: boolean = true,
): string {
  const sanitized = sanitizeFileName(fileName);
  const extension = getFileExtension(sanitized);
  const baseName = sanitized.replace(extension, "");

  let uniquePart = "";
  if (includeTimestamp) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    uniquePart = `-${timestamp}-${random}`;
  }

  const finalName = `${baseName}${uniquePart}${extension}`;

  return prefix ? `${prefix}/${finalName}` : finalName;
}

/**
 * Extract bucket, key, and region from S3 URL
 * @param url S3 URL to parse
 * @returns Object containing bucket, key, and region information
 * @public
 *
 * @example
 * ```typescript
 * import { extractS3Info } from '@kumix/storage/helpers';
 *
 * // AWS S3 virtual hosted-style
 * const result1 = extractS3Info('https://my-bucket.s3.us-west-2.amazonaws.com/folder/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "folder/file.pdf", region: "us-west-2" }
 *
 * // AWS S3 path-style
 * const result2 = extractS3Info('https://s3.eu-central-1.amazonaws.com/my-bucket/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "file.pdf", region: "eu-central-1" }
 *
 * // Custom endpoint
 * const result3 = extractS3Info('https://minio.example.com/my-bucket/folder/file.pdf');
 * // Returns: { bucket: "my-bucket", key: "folder/file.pdf" }
 * ```
 */
export function extractS3Info(url: string): {
  bucket?: string;
  key?: string;
  region?: string;
} {
  try {
    const urlObj = new URL(url);

    // AWS S3 URL patterns
    if (urlObj.hostname.includes("amazonaws.com")) {
      if (urlObj.hostname.startsWith("s3")) {
        // Path-style: https://s3.region.amazonaws.com/bucket/key
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const region = urlObj.hostname.split(".")[1];
        return {
          bucket: pathParts[0],
          key: pathParts.slice(1).join("/"),
          region,
        };
      } else {
        // Virtual hosted-style: https://bucket.s3.region.amazonaws.com/key
        const hostParts = urlObj.hostname.split(".");
        const bucket = hostParts[0];
        const region = hostParts[2];
        const key = urlObj.pathname.substring(1);
        return { bucket, key, region };
      }
    }

    // Custom endpoint (R2, MinIO, etc.)
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    return {
      bucket: pathParts[0],
      key: pathParts.slice(1).join("/"),
    };
  } catch {
    return {};
  }
}

/**
 * Validate S3 configuration object
 * @param config S3 configuration object to validate
 * @returns Validation result with list of errors
 * @public
 *
 * @example
 * ```typescript
 * import { validateS3Config } from '@kumix/storage/helpers';
 *
 * const config = {
 *   provider: 'aws',
 *   region: 'us-east-1',
 *   bucket: 'my-bucket',
 *   accessKeyId: 'AKIA...',
 *   secretAccessKey: 'secret...'
 * };
 *
 * const result = validateS3Config(config);
 * // Returns: { valid: true, errors: [] }
 *
 * const invalidConfig = { provider: 'aws' }; // Missing required fields
 * const result2 = validateS3Config(invalidConfig);
 * // Returns: { valid: false, errors: ["Region is required", "Bucket is required", ...] }
 * ```
 */
export function validateS3Config(config: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push("Provider is required");
  }

  if (!config.region) {
    errors.push("Region is required");
  }

  if (!config.bucket) {
    errors.push("Bucket is required");
  }

  if (!config.accessKeyId) {
    errors.push("Access Key ID is required");
  }

  if (!config.secretAccessKey) {
    errors.push("Secret Access Key is required");
  }

  // Validate bucket name
  if (config.bucket && typeof config.bucket === "string") {
    const bucketValidation = validateBucketName(config.bucket);
    if (!bucketValidation.valid) {
      errors.push(`Invalid bucket name: ${bucketValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate S3 bucket name according to AWS naming rules
 * @param bucketName Bucket name to validate
 * @returns Validation result with error message if invalid
 * @public
 *
 * @example
 * ```typescript
 * import { validateBucketName } from '@kumix/storage/helpers';
 *
 * const result1 = validateBucketName('my-valid-bucket');
 * // Returns: { valid: true }
 *
 * const result2 = validateBucketName('My-Invalid-Bucket');
 * // Returns: { valid: false, error: "Bucket name can only contain lowercase letters, numbers, dots, and hyphens" }
 *
 * const result3 = validateBucketName('ab');
 * // Returns: { valid: false, error: "Bucket name must be between 3 and 63 characters" }
 * ```
 */
export function validateBucketName(bucketName: string): {
  valid: boolean;
  error?: string;
} {
  if (!bucketName || bucketName.length === 0) {
    return { valid: false, error: "Bucket name cannot be empty" };
  }

  if (bucketName.length < 3 || bucketName.length > 63) {
    return {
      valid: false,
      error: "Bucket name must be between 3 and 63 characters",
    };
  }

  if (!/^[a-z0-9.-]+$/.test(bucketName)) {
    return {
      valid: false,
      error: "Bucket name can only contain lowercase letters, numbers, dots, and hyphens",
    };
  }

  if (bucketName.startsWith(".") || bucketName.endsWith(".")) {
    return {
      valid: false,
      error: "Bucket name cannot start or end with a dot",
    };
  }

  if (bucketName.startsWith("-") || bucketName.endsWith("-")) {
    return {
      valid: false,
      error: "Bucket name cannot start or end with a hyphen",
    };
  }

  if (bucketName.includes("..")) {
    return {
      valid: false,
      error: "Bucket name cannot contain consecutive dots",
    };
  }

  return { valid: true };
}

/**
 * Generate content disposition header for file downloads
 * @param fileName File name for the download
 * @param disposition Whether to display inline or as attachment
 * @returns Content disposition header string
 * @public
 *
 * @example
 * ```typescript
 * import { getContentDisposition } from '@kumix/storage/helpers';
 *
 * const header1 = getContentDisposition('document.pdf');
 * // Returns: 'attachment; filename="document.pdf"'
 *
 * const header2 = getContentDisposition('image.jpg', 'inline');
 * // Returns: 'inline; filename="image.jpg"'
 *
 * const header3 = getContentDisposition('file@#$name.txt');
 * // Returns: 'attachment; filename="filename.txt"'
 * ```
 */
export function getContentDisposition(
  fileName: string,
  disposition: "inline" | "attachment" = "attachment",
): string {
  const sanitizedName = fileName.replace(/[^\w\s.-]/gi, "");
  return `${disposition}; filename="${sanitizedName}"`;
}

/**
 * Check if file is an image based on MIME type
 * @param fileName File name or path
 * @returns True if file is an image
 * @public
 *
 * @example
 * ```typescript
 * import { isImageFile } from '@kumix/storage/helpers';
 *
 * const result1 = isImageFile('photo.jpg');
 * // Returns: true
 *
 * const result2 = isImageFile('document.pdf');
 * // Returns: false
 * ```
 */
export function isImageFile(fileName: string): boolean {
  const mimeType = getMimeType(fileName);
  return mimeType.startsWith("image/");
}

/**
 * Check if file is a video based on MIME type
 * @param fileName File name or path
 * @returns True if file is a video
 * @public
 *
 * @example
 * ```typescript
 * import { isVideoFile } from '@kumix/storage/helpers';
 *
 * const result1 = isVideoFile('movie.mp4');
 * // Returns: true
 *
 * const result2 = isVideoFile('document.pdf');
 * // Returns: false
 * ```
 */
export function isVideoFile(fileName: string): boolean {
  const mimeType = getMimeType(fileName);
  return mimeType.startsWith("video/");
}

/**
 * Check if file is an audio file based on MIME type
 * @param fileName File name or path
 * @returns True if file is an audio file
 * @public
 *
 * @example
 * ```typescript
 * import { isAudioFile } from '@kumix/storage/helpers';
 *
 * const result1 = isAudioFile('song.mp3');
 * // Returns: true
 *
 * const result2 = isAudioFile('document.pdf');
 * // Returns: false
 * ```
 */
export function isAudioFile(fileName: string): boolean {
  const mimeType = getMimeType(fileName);
  return mimeType.startsWith("audio/");
}

/**
 * Check if file is a document based on MIME type
 * @param fileName File name or path
 * @returns True if file is a document
 * @public
 *
 * @example
 * ```typescript
 * import { isDocumentFile } from '@kumix/storage/helpers';
 *
 * const result1 = isDocumentFile('report.pdf');
 * // Returns: true
 *
 * const result2 = isDocumentFile('spreadsheet.xlsx');
 * // Returns: true
 *
 * const result3 = isDocumentFile('photo.jpg');
 * // Returns: false
 * ```
 */
export function isDocumentFile(fileName: string): boolean {
  const mimeType = getMimeType(fileName);
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ];
  return documentTypes.includes(mimeType);
}

/**
 * Normalize path separators and remove redundant slashes
 * @param path Path to normalize
 * @returns Normalized path
 * @public
 *
 * @example
 * ```typescript
 * import { normalizePath } from '@kumix/storage/helpers';
 *
 * const path1 = normalizePath('folder//subfolder///file.txt');
 * // Returns: "folder/subfolder/file.txt"
 *
 * const path2 = normalizePath('\\folder\\file.txt');
 * // Returns: "folder/file.txt"
 *
 * const path3 = normalizePath('/folder/file.txt/');
 * // Returns: "folder/file.txt"
 * ```
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/") // Convert backslashes to forward slashes
    .replace(/\/+/g, "/") // Replace multiple slashes with single slash
    .replace(/^\/|\/$/g, ""); // Remove leading and trailing slashes
}

/**
 * Join path segments safely with proper separators
 * @param segments Path segments to join
 * @returns Joined path
 * @public
 *
 * @example
 * ```typescript
 * import { joinPath } from '@kumix/storage/helpers';
 *
 * const path1 = joinPath('folder', 'subfolder', 'file.txt');
 * // Returns: "folder/subfolder/file.txt"
 *
 * const path2 = joinPath('/folder/', '/subfolder/', '/file.txt/');
 * // Returns: "folder/subfolder/file.txt"
 *
 * const path3 = joinPath('', 'folder', '', 'file.txt');
 * // Returns: "folder/file.txt"
 * ```
 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter((segment) => segment && segment.trim() !== "")
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
    .filter((segment) => segment !== "")
    .join("/");
}

/**
 * Get parent directory path from a file key
 * @param key File key or path
 * @returns Parent directory path
 * @public
 *
 * @example
 * ```typescript
 * import { getParentPath } from '@kumix/storage/helpers';
 *
 * const parent1 = getParentPath('folder/subfolder/file.txt');
 * // Returns: "folder/subfolder"
 *
 * const parent2 = getParentPath('file.txt');
 * // Returns: ""
 *
 * const parent3 = getParentPath('folder/file.txt');
 * // Returns: "folder"
 * ```
 */
export function getParentPath(key: string): string {
  const normalizedKey = normalizePath(key);
  const lastSlashIndex = normalizedKey.lastIndexOf("/");
  return lastSlashIndex === -1 ? "" : normalizedKey.substring(0, lastSlashIndex);
}

/**
 * Get filename from a file key or path
 * @param key File key or path
 * @returns Filename without path
 * @public
 *
 * @example
 * ```typescript
 * import { getFileName } from '@kumix/storage/helpers';
 *
 * const name1 = getFileName('folder/subfolder/document.pdf');
 * // Returns: "document.pdf"
 *
 * const name2 = getFileName('file.txt');
 * // Returns: "file.txt"
 *
 * const name3 = getFileName('folder/subfolder/');
 * // Returns: ""
 * ```
 */
export function getFileName(key: string): string {
  const normalizedKey = normalizePath(key);
  const lastSlashIndex = normalizedKey.lastIndexOf("/");
  return lastSlashIndex === -1 ? normalizedKey : normalizedKey.substring(lastSlashIndex + 1);
}

/**
 * Convert base64 string to Buffer
 * @param base64 Base64 encoded string
 * @returns Buffer containing the decoded data
 * @public
 *
 * @example
 * ```typescript
 * import { base64ToBuffer } from '@kumix/storage/helpers';
 *
 * const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
 * const buffer = base64ToBuffer(base64);
 * console.log(buffer.toString()); // "Hello World"
 *
 * // For file uploads from base64 data
 * const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...';
 * const cleanBase64 = imageBase64.split(',')[1]; // Remove data URL prefix
 * const imageBuffer = base64ToBuffer(cleanBase64);
 * await storage.uploadFile('images/photo.jpg', imageBuffer);
 * ```
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(cleanBase64, "base64");
  }

  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Buffer to base64 string
 * @param buffer Buffer to encode
 * @param includeDataUrl Whether to include data URL prefix
 * @param mimeType MIME type for data URL (required if includeDataUrl is true)
 * @returns Base64 encoded string
 * @public
 *
 * @example
 * ```typescript
 * import { bufferToBase64 } from '@kumix/storage/helpers';
 *
 * const buffer = Buffer.from('Hello World');
 * const base64 = bufferToBase64(buffer);
 * // Returns: "SGVsbG8gV29ybGQ="
 *
 * // With data URL for images
 * const imageBuffer = await storage.downloadFile('images/photo.jpg');
 * const dataUrl = bufferToBase64(imageBuffer.content!, true, 'image/jpeg');
 * // Returns: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
 *
 * // Use in HTML img tag
 * document.querySelector('img').src = dataUrl;
 * ```
 */
export function bufferToBase64(
  buffer: Uint8Array,
  includeDataUrl: boolean = false,
  mimeType?: string,
): string {
  let base64: string;

  if (typeof Buffer !== "undefined" && buffer instanceof Buffer) {
    base64 = buffer.toString("base64");
  } else {
    let binary = "";
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    base64 = btoa(binary);
  }

  if (includeDataUrl) {
    if (!mimeType) {
      throw new Error("MIME type is required when includeDataUrl is true");
    }
    return `data:${mimeType};base64,${base64}`;
  }

  return base64;
}

/**
 * Generate file hash/checksum for integrity verification
 * @param content File content as Buffer or string
 * @param algorithm Hash algorithm to use
 * @returns Hash string
 * @public
 *
 * @example
 * ```typescript
 * import { generateFileHash } from '@kumix/storage/helpers';
 *
 * const content = Buffer.from('Hello World');
 *
 * const md5Hash = generateFileHash(content, 'md5');
 * // Returns: "b10a8db164e0754105b7a99be72e3fe5"
 *
 * const sha256Hash = generateFileHash(content, 'sha256');
 * // Returns: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
 *
 * // For file integrity checking
 * const fileBuffer = await storage.downloadFile('document.pdf');
 * const currentHash = generateFileHash(fileBuffer.content!, 'sha256');
 * const expectedHash = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';
 *
 * if (currentHash === expectedHash) {
 *   console.log('File integrity verified');
 * } else {
 *   console.log('File may be corrupted');
 * }
 * ```
 */
export async function generateFileHash(
  content: Uint8Array | string,
  algorithm: "md5" | "sha1" | "sha256" = "md5",
): Promise<string> {
  if (algorithm !== "md5" && typeof crypto !== "undefined" && crypto.subtle) {
    const rawData = typeof content === "string" ? new TextEncoder().encode(content) : content;
    const hashBuffer = await crypto.subtle.digest(
      algorithm === "sha1" ? "SHA-1" : "SHA-256",
      // biome-ignore lint/suspicious/noExplicitAny: <>
      rawData as any,
    );
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const nodeCrypto = await import("node:crypto");
  const hash = nodeCrypto.createHash(algorithm);
  // biome-ignore lint/suspicious/noExplicitAny: <>
  hash.update(content as any);
  return hash.digest("hex");
}

/**
 * Generate multiple unique keys at once for batch operations
 * @param fileNames Array of file names
 * @param prefix Optional prefix for all keys
 * @returns Array of unique keys
 * @public
 *
 * @example
 * ```typescript
 * import { generateBatchKeys } from '@kumix/storage/helpers';
 *
 * const fileNames = ['document1.pdf', 'document2.pdf', 'image.jpg'];
 * const keys = generateBatchKeys(fileNames, 'uploads');
 * // Returns: [
 * //   "uploads/document1-1703123456789-abc123.pdf",
 * //   "uploads/document2-1703123456790-def456.pdf",
 * //   "uploads/image-1703123456791-ghi789.jpg"
 * // ]
 *
 * // Use for batch uploads
 * const files = [file1, file2, file3];
 * const keys = generateBatchKeys(files.map(f => f.name), 'batch-upload');
 *
 * for (let i = 0; i < files.length; i++) {
 *   await storage.uploadFile(keys[i], files[i]);
 * }
 * ```
 */
export function generateBatchKeys(fileNames: string[], prefix?: string): string[] {
  return fileNames.map((fileName) => generateFileKey(fileName, prefix));
}

/**
 * Validate multiple files at once with consistent options
 * @param files Array of File objects to validate
 * @param options Validation options
 * @returns Array of validation results
 * @public
 *
 * @example
 * ```typescript
 * import { validateBatchFiles } from '@kumix/storage/helpers';
 *
 * const files = [file1, file2, file3]; // File objects from input
 * const options = {
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: ['image/*', 'application/pdf'],
 *   maxFiles: 10
 * };
 *
 * const results = validateBatchFiles(files, options);
 * // Returns: [
 * //   { valid: true, fileName: "image.jpg" },
 * //   { valid: false, fileName: "large.pdf", errors: ["File size exceeds limit"] },
 * //   { valid: true, fileName: "document.pdf" }
 * // ]
 *
 * const validFiles = files.filter((_, index) => results[index].valid);
 * const invalidFiles = files.filter((_, index) => !results[index].valid);
 * ```
 */
export function validateBatchFiles(
  files: File[],
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  },
): Array<{ valid: boolean; fileName: string; errors?: string[] }> {
  const results: Array<{
    valid: boolean;
    fileName: string;
    errors?: string[];
  }> = [];

  // Check max files limit
  if (options.maxFiles && files.length > options.maxFiles) {
    return files.map((file) => ({
      valid: false,
      fileName: file.name,
      errors: [`Maximum ${options.maxFiles} files allowed, but ${files.length} files provided`],
    }));
  }

  for (const file of files) {
    const errors: string[] = [];

    // Validate file size
    if (options.maxSize) {
      const sizeResult = validateFileSize(file.size, options.maxSize);
      if (!sizeResult.valid && sizeResult.error) {
        errors.push(sizeResult.error);
      }
    }

    // Validate file type
    if (options.allowedTypes) {
      const typeResult = validateFileType(file.name, options.allowedTypes);
      if (!typeResult.valid && typeResult.error) {
        errors.push(typeResult.error);
      }
    }

    results.push({
      valid: errors.length === 0,
      fileName: file.name,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  return results;
}

/**
 * Detect file type from content using magic numbers/file signatures
 * @param buffer File content buffer
 * @returns Detected MIME type or 'application/octet-stream' if unknown
 * @public
 *
 * @example
 * ```typescript
 * import { detectFileTypeFromContent } from '@kumix/storage/helpers';
 *
 * // Read file content
 * const fileBuffer = await storage.downloadFile('unknown-file');
 * const detectedType = detectFileTypeFromContent(fileBuffer.content!);
 *
 * console.log(detectedType);
 * // Returns: "image/jpeg" for JPEG files
 * // Returns: "application/pdf" for PDF files
 * // Returns: "image/png" for PNG files
 * // Returns: "application/octet-stream" for unknown types
 *
 * // Verify file type matches extension
 * const fileName = 'document.pdf';
 * const expectedType = getMimeType(fileName);
 * const actualType = detectFileTypeFromContent(fileBuffer.content!);
 *
 * if (expectedType !== actualType) {
 *   console.warn('File extension does not match content type');
 * }
 * ```
 */
export function detectFileTypeFromContent(buffer: Uint8Array): string {
  if (buffer.length === 0) {
    return "application/octet-stream";
  }

  // Check magic numbers/file signatures
  const header = buffer.subarray(0, 16);

  // PDF
  if (header.subarray(0, 4).reduce((s, b) => s + String.fromCharCode(b), "") === "%PDF") {
    return "application/pdf";
  }

  // JPEG
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  const pngSig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (header.length >= 8 && header.slice(0, 8).every((b, i) => b === pngSig[i])) {
    return "image/png";
  }

  // GIF
  const gifHead = header.subarray(0, 6).reduce((s, b) => s + String.fromCharCode(b), "");
  if (gifHead === "GIF87a" || gifHead === "GIF89a") {
    return "image/gif";
  }

  // WebP
  if (
    header.subarray(0, 4).reduce((s, b) => s + String.fromCharCode(b), "") === "RIFF" &&
    header.subarray(8, 12).reduce((s, b) => s + String.fromCharCode(b), "") === "WEBP"
  ) {
    return "image/webp";
  }

  // ZIP (includes DOCX, XLSX, etc.)
  if (header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05)) {
    const zipContent = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.length, 1000)));
    if (zipContent.includes("word/"))
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (zipContent.includes("xl/"))
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (zipContent.includes("ppt/"))
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    return "application/zip";
  }

  // MP4
  if (new TextDecoder().decode(header.subarray(4, 8)) === "ftyp") {
    return "video/mp4";
  }

  // MP3
  if (
    (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) ||
    new TextDecoder().decode(header.subarray(0, 3)) === "ID3"
  ) {
    return "audio/mpeg";
  }

  // Text files (check if all bytes are printable ASCII or UTF-8)
  let isText = true;
  const sampleSize = Math.min(buffer.length, 512);
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isText = false;
      break;
    }
  }

  if (isText) {
    return "text/plain";
  }

  return "application/octet-stream";
}
