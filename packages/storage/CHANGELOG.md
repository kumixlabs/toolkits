# @kumix/storage

## 0.1.2

### Patch Changes

- [`70db108`](https://github.com/kumixlabs/toolkits/commit/70db108655ec33124b44573370f25328b6cd615b) Thanks [@kumixio](https://github.com/kumixio)! - Fix multiple bugs and align the optional-dependency loading with the package's cross-runtime design:

  - Load the optional peer deps (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `cloudinary`) via dynamic `import()` so partial installs no longer break the `./s3` and `./cloudinary` subpaths at module load.
  - Cloudinary `deleteFolder`: prepend `config.folder` so recursive deletes target the same prefix used by `upload`/`delete`/`exists`.
  - Cloudinary `download`: pass the extension through so the resource type (image/video/raw) is inferred correctly instead of defaulting to `raw` and 404-ing.
  - Cloudinary `list`: produce valid MIME types (no more `raw/pdf` or `image/jpg`).
  - Cloudinary `upload`: keep the extension in the public_id for `raw` assets so the stored id round-trips.
  - Cloudinary `listFolders`: narrow `unknown` folder fields to `string`.
  - `CloudinaryService` convenience methods now share the same signatures as `S3Service` (options object instead of positional `contentType`/`metadata`).
  - `copyFolder`: default `recursive` to `true`, matching `S3Service.copyFolderPath`.
  - `generateUniqueKey`/`getFileExtension`: strip only the trailing extension and handle a trailing-dot filename.
  - S3 default public URL now percent-encodes each key segment.

## 0.1.1

### Patch Changes

- [`fb6c76d`](https://github.com/kumixlabs/toolkits/commit/fb6c76dbbf80af936474261161f1eb4acf920f59) Thanks [@kumixio](https://github.com/kumixio)! - Fix Cloudinary `list()` pagination to use type-encoded cursor (prevents cross-type bleed + maxKeys overflow). Fix `batchDelete` to return `success: false` on partial failures (was always returning `true`). Percent-encode `CopySource` in S3 copy operations (fixes keys with special chars). `getPublicUrl` re-prepends `config.folder` to round-trip keys correctly. Add `createCloudinary(config: undefined, env)` overload to match `createS3`. Make `FolderInfo` fields optional. Load `sessionToken` from `KUMIX_S3_SESSION_TOKEN` env var. Remove dead try/catch blocks in unimplemented Cloudinary stubs.

## 0.1.0

### Minor Changes

- [`05716a3`](https://github.com/kumixlabs/toolkits/commit/05716a3890c3db47ced8181e76d90a0f52e42975) Thanks [@kumixio](https://github.com/kumixio)! - Initial release of `@kumix/storage` — S3/R2/MinIO/Spaces/Supabase and Cloudinary storage utilities. Ships ESM-only builds via tsdown with full type declarations, optional peer dependencies, and `.`, `./s3`, `./cloudinary`, and `./helpers` entry points.
