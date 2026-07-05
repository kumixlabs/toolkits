# @kumix/email

## 1.2.0

### Minor Changes

- [`f6098b5`](https://github.com/kumixlabs/toolkits/commit/f6098b5906b5520b6dbcdc91d7dc8760b7df5b19) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Add cross-runtime support (Node.js, Bun, Cloudflare Workers, Deno, browser):
  - `EnvRecord` pattern: all config/factory functions accept optional `env` parameter
  - `process.env` access guarded via `typeof process !== "undefined"`
  - NodemailerProvider uses dynamic `await import()` to prevent crashes in non-Node runtimes
  - Attachment types: `Buffer` → `Uint8Array`
  - `sendTemplate` now reuses `renderEmailTemplate` + `htmlToText` helpers
  - Expanded test suite (132 → 169 tests): EnvRecord coverage, `validateResendEnvVars`, port/fallback var edge cases
  - Updated README with per-runtime usage guides and compatibility table

## 1.1.1

### Patch Changes

- [`9494e8b`](https://github.com/kumixlabs/toolkits/commit/9494e8b569b614ccf7f039a2b312cabc39a446c9) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.1.0

### Minor Changes

- [`c51b039`](https://github.com/kumixlabs/toolkits/commit/c51b039e7679994ec81d0d8d172c86704210008e) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Change @react-email/components to react email

## 1.0.21

### Patch Changes

- [`17b64b1`](https://github.com/kumixlabs/toolkits/commit/17b64b18a2655f3ad92176da32e41150a05bb722) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.20

### Patch Changes

- [`a6a7701`](https://github.com/kumixlabs/toolkits/commit/a6a7701d60f2921e4b287f777f49cce3e7c11275) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.19

### Patch Changes

- [`5c04611`](https://github.com/kumixlabs/toolkits/commit/5c046118667eb1b64bcaea15a335bff262a7bb15) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Updated peerDependencies

## 1.0.18

### Patch Changes

- [`e97cbbd`](https://github.com/kumixlabs/toolkits/commit/e97cbbdbf24e29cd7e63d3aadf85317056003a66) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Adjust peer dependencies in tsup.config files for better management.

## 1.0.17

### Patch Changes

- [`ff8d9a7`](https://github.com/kumixlabs/toolkits/commit/ff8d9a76c02079281f3178406c01486a1eac7a8c) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.16

### Patch Changes

- [`776f289`](https://github.com/kumixlabs/toolkits/commit/776f28955410f434c1fe385423c1d7ddd071d455) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.15

### Patch Changes

- [`5f6a8dd`](https://github.com/kumixlabs/toolkits/commit/5f6a8ddf55ab57499c6603ba221ff782d9717a14) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.14

### Patch Changes

- [`c2d7620`](https://github.com/kumixlabs/toolkits/commit/c2d7620c90aebe98b95a8a30e967fe15f50278fa) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.13

### Patch Changes

- [`c4e062d`](https://github.com/kumixlabs/toolkits/commit/c4e062d3367293f52293cb3edfaa06abcbcb9095) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.12

### Patch Changes

- [`704264d`](https://github.com/kumixlabs/toolkits/commit/704264d3ca69e7ec21bb1699a504ef40dac304ca) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.11

### Patch Changes

- [`d81e786`](https://github.com/kumixlabs/toolkits/commit/d81e78672d8d12f1128e651095e3c4f097796ea3) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.10

### Patch Changes

- [`bf1b762`](https://github.com/kumixlabs/toolkits/commit/bf1b762328e7c7e919e0db51b896f61576271b55) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.9

### Patch Changes

- [`217c53c`](https://github.com/kumixlabs/toolkits/commit/217c53cf19e208050e94278dcc6f5abc3dd1dedd) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

- [`58a924c`](https://github.com/kumixlabs/toolkits/commit/58a924c671a14759995bf11e8c8f436280aea9c0) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest versions

## 1.0.8

### Patch Changes

- [`33d27e1`](https://github.com/kumixlabs/toolkits/commit/33d27e176fa0f589ae936cf64da9920ca2215b4f) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - core update

## 1.0.7

### Patch Changes

- [`0775563`](https://github.com/kumixlabs/toolkits/commit/0775563b721259d767f6dab2d8c3dad42d6e491a) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update @react-email/components to 1.0.2

## 1.0.6

### Patch Changes

- [`9bb7728`](https://github.com/kumixlabs/toolkits/commit/9bb77287752e8786b2417e5d938d5cafb0ac345e) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update dependencies to latest version

## 1.0.5

### Patch Changes

- [`61ff739`](https://github.com/kumixlabs/toolkits/commit/61ff73966ec209d3f27d782b2c8bf08955747be0) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - - Code refactoring and cleanup across all modules
  - Improved import statements consistency
  - Simplified conditional logic and validation checks
  - Changed Number.parseInt to parseInt for consistency
  - Removed unnecessary multiline formatting
  - Cleaned up TypeScript configuration

## 1.0.4

### Patch Changes

- [`3d4cd18`](https://github.com/kumixlabs/toolkits/commit/3d4cd18b4c2c2eadc1fc4168df9d545d9103a79b) Thanks [@lukmanaviccena](https://github.com/lukmanaviccena)! - Update release
