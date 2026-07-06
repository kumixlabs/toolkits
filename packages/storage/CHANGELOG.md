# @kumix/storage

## 0.1.1

### Patch Changes

- [`fb6c76d`](https://github.com/kumixlabs/toolkits/commit/fb6c76dbbf80af936474261161f1eb4acf920f59) Thanks [@kumixio](https://github.com/kumixio)! - Fix Cloudinary `list()` pagination to use type-encoded cursor (prevents cross-type bleed + maxKeys overflow). Fix `batchDelete` to return `success: false` on partial failures (was always returning `true`). Percent-encode `CopySource` in S3 copy operations (fixes keys with special chars). `getPublicUrl` re-prepends `config.folder` to round-trip keys correctly. Add `createCloudinary(config: undefined, env)` overload to match `createS3`. Make `FolderInfo` fields optional. Load `sessionToken` from `KUMIX_S3_SESSION_TOKEN` env var. Remove dead try/catch blocks in unimplemented Cloudinary stubs.

## 0.1.0

### Minor Changes

- [`05716a3`](https://github.com/kumixlabs/toolkits/commit/05716a3890c3db47ced8181e76d90a0f52e42975) Thanks [@kumixio](https://github.com/kumixio)! - Initial release of `@kumix/storage` — S3/R2/MinIO/Spaces/Supabase and Cloudinary storage utilities. Ships ESM-only builds via tsdown with full type declarations, optional peer dependencies, and `.`, `./s3`, `./cloudinary`, and `./helpers` entry points.
