# @kumix/storage

[![Version](https://img.shields.io/npm/v/@kumix/storage.svg)](https://www.npmjs.com/package/@kumix/storage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive storage utilities package for SaaS applications. This package provides a unified interface for working with various storage providers including AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Supabase Storage, and Cloudinary.

## Installation

```bash
npm install @kumix/storage
# or
bun add @kumix/storage

# Install peer dependencies for the provider(s) you need
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner  # For S3-compatible providers
npm install cloudinary  # For Cloudinary
```

## Quick Start

### S3-Compatible Storage (AWS, R2, MinIO, etc.)

```typescript
import { S3Service } from "@kumix/storage/s3";

const storage = new S3Service({
  provider: "aws", // or 'cloudflare-r2', 'minio', 'digitalocean', 'supabase'
  region: "us-east-1",
  bucket: "my-bucket",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Upload a file
await storage.upload({
  key: "documents/file.pdf",
  file: fileBuffer,
  contentType: "application/pdf",
});

// Download a file
const result = await storage.download({ key: "documents/file.pdf" });

// Generate a presigned URL (temporary access)
const url = await storage.getPresignedUrl({
  key: "documents/file.pdf",
  operation: "get",
  expiresIn: 3600, // 1 hour
});
```

### Cloudinary Storage

```typescript
import { CloudinaryService } from "@kumix/storage/cloudinary";

const storage = new CloudinaryService({
  provider: "cloudinary",
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image
await storage.upload({
  key: "images/photo.jpg",
  file: imageBuffer,
  contentType: "image/jpeg",
});
```

## Key Features

- **Unified Interface**: Single API for multiple storage providers
- **S3-Compatible Providers**: AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Supabase Storage
- **Cloudinary Support**: Image and media management with built-in optimizations
- **File Operations**: Upload, download, delete, copy, move, and check existence
- **Folder Operations**: Create, delete, list, and manage folders
- **Presigned URLs**: Generate time-limited access URLs for secure sharing
- **Public URLs**: Get public access URLs with optional CDN support
- **Type-Safe**: Full TypeScript support with comprehensive types
- **Flexible Configuration**: Support for custom endpoints and CDN URLs

## Supported Providers

### S3-Compatible

- **AWS S3** - Amazon's object storage service
- **Cloudflare R2** - Cloudflare's S3-compatible storage (no egress fees)
- **MinIO** - Self-hosted S3-compatible storage
- **DigitalOcean Spaces** - DigitalOcean's object storage
- **Supabase Storage** - Supabase's S3-compatible storage

### Other Providers

- **Cloudinary** - Image and video management platform

## Configuration

### AWS S3

```typescript
const storage = new S3Service({
  provider: "aws",
  region: "us-east-1",
  bucket: "my-bucket",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  publicUrl: "https://cdn.example.com", // Optional CDN URL
});
```

### Cloudflare R2

```typescript
const storage = new S3Service({
  provider: "cloudflare-r2",
  region: "auto",
  bucket: "my-bucket",
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: "https://<account-id>.r2.cloudflarestorage.com",
});
```

### MinIO

```typescript
const storage = new S3Service({
  provider: "minio",
  region: "us-east-1",
  bucket: "my-bucket",
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin",
  endpoint: "http://localhost:9000",
  forcePathStyle: true, // Required for MinIO
});
```

## Basic Usage

### File Operations

```typescript
// Upload with options
await storage.upload({
  key: "uploads/document.pdf",
  file: buffer,
  contentType: "application/pdf",
  metadata: { userId: "123", category: "documents" },
  cacheControl: "max-age=31536000",
});

// Download file
const { content, metadata } = await storage.download({
  key: "uploads/document.pdf",
});

// Check if file exists
const exists = await storage.exists("uploads/document.pdf");

// Delete file
await storage.delete({ key: "uploads/document.pdf" });

// Copy file
await storage.copy({
  sourceKey: "uploads/old.pdf",
  destinationKey: "uploads/new.pdf",
});

// Move file
await storage.move({
  sourceKey: "uploads/temp.pdf",
  destinationKey: "uploads/final.pdf",
});

// List files
const files = await storage.list({
  prefix: "uploads/",
  maxKeys: 100,
});
```

### Folder Operations

```typescript
// Create folder
await storage.createFolder({ path: "documents/" });

// Delete folder (recursive)
await storage.deleteFolder({
  path: "documents/",
  recursive: true,
});

// List folders
const folders = await storage.listFolders({
  prefix: "uploads/",
});

// Check if folder exists
const exists = await storage.folderExists("documents/");
```

### URL Generation

```typescript
// Get public URL
const publicUrl = storage.getPublicUrl("images/photo.jpg");

// Generate presigned URL for download
const downloadUrl = await storage.getPresignedUrl({
  key: "documents/private.pdf",
  operation: "get",
  expiresIn: 3600, // 1 hour
});

// Generate presigned URL for upload
const uploadUrl = await storage.getPresignedUrl({
  key: "uploads/new-file.pdf",
  operation: "put",
  expiresIn: 900, // 15 minutes
  contentType: "application/pdf",
});
```

## API Reference

### File Operations

- `upload(options)` - Upload a file
- `download(options)` - Download a file
- `delete(options)` - Delete a file
- `exists(key)` - Check if file exists
- `copy(options)` - Copy a file
- `move(options)` - Move a file
- `list(options)` - List files with prefix
- `getPresignedUrl(options)` - Generate presigned URL
- `getPublicUrl(key)` - Get public URL

### Folder Operations

- `createFolder(options)` - Create a folder
- `deleteFolder(options)` - Delete a folder
- `listFolders(options)` - List folders
- `folderExists(path)` - Check if folder exists

## Runtime Compatibility

| Export         | Node.js | Bun | CF Workers | Deno | Browser |
| -------------- | ------- | --- | ---------- | ---- | ------- |
| `.` (config)   | Yes     | Yes | Yes\*      | Yes  | Yes     |
| `./helpers`    | Yes     | Yes | Yes        | Yes  | Yes     |
| `./s3`         | Yes     | Yes | No         | Yes  | No      |
| `./cloudinary` | Yes     | Yes | No         | Yes  | No      |

\* Pass env via `EnvRecord`: `loadS3Config(myEnv)`.

### `EnvRecord` Pattern

All config functions accept an optional `env` parameter. On Node/Bun it defaults to `process.env`. On other runtimes, pass your environment explicitly:

```typescript
import { loadS3Config, loadCloudinaryConfig, hasStorageConfig } from "@kumix/storage";

// Cloudflare Workers
const config = loadS3Config(ctx.env);

// Deno
const config = loadCloudinaryConfig(Deno.env.toObject());

// Manual config (works everywhere, no env needed)
const s3 = createS3({ provider: "aws", region: "us-east-1", ... });
const cloudinary = createCloudinary({ provider: "cloudinary", cloudName: "...", ... });
```

> **Note**: `./s3` and `./cloudinary` subpaths require the AWS SDK or Cloudinary SDK
> peer dependencies respectively, which are Node.js packages. Use these subpaths only in
> Node.js, Bun, or Deno environments.

## Links

- [npm Package](https://www.npmjs.com/package/@kumix/storage)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)
- [License](../../LICENSE)

## License

MIT © [Kumix Labs](../../LICENSE)
