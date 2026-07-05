# @kumix/storage

## 1.1.0

### Minor Changes

- [`f6098b5`](https://github.com/kumixlabs/toolkits/commit/f6098b5906b5520b6dbcdc91d7dc8760b7df5b19) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add cross-runtime support (Node.js, Bun, Cloudflare Workers, Deno, browser):
  - `EnvRecord` pattern: all config functions accept optional `env` parameter
  - `process.env` guarded at module level; removed top-level side effect in `s3.ts`
  - Helpers now use `Uint8Array` instead of `Buffer`, Web Crypto API fallback for hashing
  - `base64ToBuffer` / `bufferToBase64` use `atob`/`btoa` when Buffer unavailable
  - `detectFileTypeFromContent` uses `TextDecoder` and `Uint8Array` comparison
  - Deleted dead `factory.ts` (all comments, no active code)
  - Updated README with runtime compatibility table and `EnvRecord` docs

## 1.0.16

### Patch Changes

- [`9494e8b`](https://github.com/kumixlabs/toolkits/commit/9494e8b569b614ccf7f039a2b312cabc39a446c9) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.15

### Patch Changes

- [`17b64b1`](https://github.com/kumixlabs/toolkits/commit/17b64b18a2655f3ad92176da32e41150a05bb722) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.14

### Patch Changes

- [`a6a7701`](https://github.com/kumixlabs/toolkits/commit/a6a7701d60f2921e4b287f777f49cce3e7c11275) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.13

### Patch Changes

- [`e97cbbd`](https://github.com/kumixlabs/toolkits/commit/e97cbbdbf24e29cd7e63d3aadf85317056003a66) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Adjust peer dependencies in tsup.config files for better management.

## 1.0.12

### Patch Changes

- [`ff8d9a7`](https://github.com/kumixlabs/toolkits/commit/ff8d9a76c02079281f3178406c01486a1eac7a8c) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.11

### Patch Changes

- [`5f6a8dd`](https://github.com/kumixlabs/toolkits/commit/5f6a8ddf55ab57499c6603ba221ff782d9717a14) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.10

### Patch Changes

- [`c4e062d`](https://github.com/kumixlabs/toolkits/commit/c4e062d3367293f52293cb3edfaa06abcbcb9095) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.9

### Patch Changes

- [`704264d`](https://github.com/kumixlabs/toolkits/commit/704264d3ca69e7ec21bb1699a504ef40dac304ca) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.8

### Patch Changes

- [`33d27e1`](https://github.com/kumixlabs/toolkits/commit/33d27e176fa0f589ae936cf64da9920ca2215b4f) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - core update

## 1.0.7

### Patch Changes

- [`a6eae4a`](https://github.com/kumixlabs/toolkits/commit/a6eae4a109c0f78b2d611d5015e7de9bf9fea1cc) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Enhance buildPublicUrl to support Cloudflare R2 and Supabase and improve Cloudinary upload handling with folder support and extension fixes

## 1.0.6

### Patch Changes

- [`9c92960`](https://github.com/kumixlabs/toolkits/commit/9c92960de09cc822a15bbb851e93edecd63d8fd1) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add S3_PROVIDER constant and getSupabasePublicUrl helper function

## 1.0.5

### Patch Changes

- [`9bb7728`](https://github.com/kumixlabs/toolkits/commit/9bb77287752e8786b2417e5d938d5cafb0ac345e) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest version

## 1.0.4

### Patch Changes

- [`61ff739`](https://github.com/kumixlabs/toolkits/commit/61ff73966ec209d3f27d782b2c8bf08955747be0) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - - Major code refactoring and cleanup
  - Improved S3 URL parsing logic (added virtual hosted-style support)
  - Simplified file validation and helper functions
  - Enhanced type annotations (explicit parameter types)
  - Optimized Cloudinary and S3 provider implementations
  - Reduced code complexity across operations modules
  - Updated tsup configuration

## 1.0.3

### Patch Changes

- [`3d4cd18`](https://github.com/kumixlabs/toolkits/commit/3d4cd18b4c2c2eadc1fc4168df9d545d9103a79b) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update release
