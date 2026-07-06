---
"@kumix/storage": patch
---

Fix Cloudinary `list()` pagination to use type-encoded cursor (prevents cross-type bleed + maxKeys overflow). Fix `batchDelete` to return `success: false` on partial failures (was always returning `true`). Percent-encode `CopySource` in S3 copy operations (fixes keys with special chars). `getPublicUrl` re-prepends `config.folder` to round-trip keys correctly. Add `createCloudinary(config: undefined, env)` overload to match `createS3`. Make `FolderInfo` fields optional. Load `sessionToken` from `KUMIX_S3_SESSION_TOKEN` env var. Remove dead try/catch blocks in unimplemented Cloudinary stubs.
