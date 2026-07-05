# @kumix/utils

## 1.1.1

### Patch Changes

- [`7849a02`](https://github.com/kumixlabs/toolkits/commit/7849a02eccb3537424cb941dda8dc0df61f4c9d5) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add ULID-based time-sortable ID generation and a runtime-agnostic environment variable reader.
  - **`baseId`** / **`baseIdCustom`**: new prefixed, time-sortable, ULID-compatible ID generators in `crypto/base-id` (uses `base-x` base32 encoding).
  - **`getEnv`**: new cross-runtime env reader exported from the main entry — works across Bun, Node, Deno, and Workers without throwing.
  - Refactored env access in `constants/development`, `constants/env`, and `functions/string/assets` to use `getEnv` for consistent cross-runtime behavior.

## 1.1.0

### Minor Changes

- [`f6098b5`](https://github.com/kumixlabs/toolkits/commit/f6098b5906b5520b6dbcdc91d7dc8760b7df5b19) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Improve cross-runtime safety for all environments:
  - Constants (`development.ts`, `env.ts`, `assets.ts`): use guarded `process.env` access (`typeof process !== "undefined"`)
  - Browser functions: add SSR guards in `getHeight`, `resizeImage`, `loadImage`
  - Fix `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` in `debounce.ts`
  - Delete dead files: `constants/main.ts`, `browser/is-click-on-interactive-child.ts`, `string/punycode.ts`, `string/translations.ts`
  - Clean stale JSDoc references to deleted modules in `link-constructor.ts`
  - Updated README with runtime compatibility section

## 1.0.19

### Patch Changes

- [`9494e8b`](https://github.com/kumixlabs/toolkits/commit/9494e8b569b614ccf7f039a2b312cabc39a446c9) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.18

### Patch Changes

- [`17b64b1`](https://github.com/kumixlabs/toolkits/commit/17b64b18a2655f3ad92176da32e41150a05bb722) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.17

### Patch Changes

- [`a6a7701`](https://github.com/kumixlabs/toolkits/commit/a6a7701d60f2921e4b287f777f49cce3e7c11275) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.16

### Patch Changes

- [`e97cbbd`](https://github.com/kumixlabs/toolkits/commit/e97cbbdbf24e29cd7e63d3aadf85317056003a66) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Adjust peer dependencies in tsup.config files for better management.

## 1.0.15

### Patch Changes

- [`ff8d9a7`](https://github.com/kumixlabs/toolkits/commit/ff8d9a76c02079281f3178406c01486a1eac7a8c) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.14

### Patch Changes

- [`254a592`](https://github.com/kumixlabs/toolkits/commit/254a592f2a4e683a8c2360ce793a8dc5c5d0f1bd) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.13

### Patch Changes

- [`5f6a8dd`](https://github.com/kumixlabs/toolkits/commit/5f6a8ddf55ab57499c6603ba221ff782d9717a14) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.12

### Patch Changes

- [`c4e062d`](https://github.com/kumixlabs/toolkits/commit/c4e062d3367293f52293cb3edfaa06abcbcb9095) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Improve resizeAndCropImage function

## 1.0.11

### Patch Changes

- [`704264d`](https://github.com/kumixlabs/toolkits/commit/704264d3ca69e7ec21bb1699a504ef40dac304ca) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.10

### Patch Changes

- [`89f4a1e`](https://github.com/kumixlabs/toolkits/commit/89f4a1ed8676ddb09f53b67c1d02d003db5827fa) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Rename `fetcher` to `fetcherSWR` and `request` to `fetcher` for better clarity

## 1.0.9

### Patch Changes

- [`9dd34af`](https://github.com/kumixlabs/toolkits/commit/9dd34afa22f5dc7a34fbda8efe15045f20ed9615) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Simplify fetcher and request functions

## 1.0.8

### Patch Changes

- [`edbc46e`](https://github.com/kumixlabs/toolkits/commit/edbc46ee34cd85b2e6f565e26502bce9ac56eb3d) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Improve http fetcher with better error handling and parsing

## 1.0.7

### Patch Changes

- [`33d27e1`](https://github.com/kumixlabs/toolkits/commit/33d27e176fa0f589ae936cf64da9920ca2215b4f) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - core update

## 1.0.6

### Patch Changes

- [`1b4a0e7`](https://github.com/kumixlabs/toolkits/commit/1b4a0e73fa0f9b41fe8507e57e4c17ba43238d84) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add auth utility functions and improve locale mapping

## 1.0.5

### Patch Changes

- [`90a6054`](https://github.com/kumixlabs/toolkits/commit/90a60549c9c50e00fec0deeb27b3330561823788) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Reorganize and consolidate utility functions
  - Restructure imports and exports for better organization
  - Move constants into dedicated files with clear categorization
  - Update import paths to reflect new structure
  - Add new utility functions for translations, colors, and request parsing
  - Improve documentation and type safety across utilities

- [`f052ff3`](https://github.com/kumixlabs/toolkits/commit/f052ff38be46aa7678e325fb2ab8512a14dd883f) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add translations utility export

- [`9bb7728`](https://github.com/kumixlabs/toolkits/commit/9bb77287752e8786b2417e5d938d5cafb0ac345e) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest version

## 1.0.4

### Patch Changes

- [`61ff739`](https://github.com/kumixlabs/toolkits/commit/61ff73966ec209d3f27d782b2c8bf08955747be0) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - - Extensive code refactoring across 73 files
  - Simplified function signatures and implementations
  - Improved consistency in code formatting
  - Optimized utility functions in multiple categories:
    - Analytics (Google Analytics utilities)
    - Array, browser, crypto operations
    - Date/time formatting and parsing
    - String manipulation and validation
    - URL handling and construction
    - HTTP utilities (fetcher, retry, IP detection)
    - Logging and performance monitoring
  - Cleaned up TypeScript configuration

## 1.0.3

### Patch Changes

- [`cfe82d7`](https://github.com/kumixlabs/toolkits/commit/cfe82d7b78c572ffee7a711eda24e787bc9f85cd) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update release
