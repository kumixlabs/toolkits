---
"@kumix/storage": patch
---

Fix multiple bugs and align the optional-dependency loading with the package's cross-runtime design:

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
