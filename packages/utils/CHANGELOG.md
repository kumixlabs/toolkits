# @kumix/utils

## 0.1.1

### Patch Changes

- [`fb6c76d`](https://github.com/kumixlabs/toolkits/commit/fb6c76dbbf80af936474261161f1eb4acf920f59) Thanks [@kumixio](https://github.com/kumixio)! - Fix JWT verification error message to cover both bad signature and malformed token. Reclassify `bcryptjs`/`jsonwebtoken` as devDependencies (bundled by tsdown into server output). Pin `chrono-node` to `^2.9.1`. Replace `any[]` with `never[]` in debounce/throttle generic constraints. Add comprehensive test coverage for `deepEqual` (Map/Set/Date/RegExp/Array), `isIframeable`, and `getClientIPFromHeaders`.

## 0.1.0

### Minor Changes

- [`05716a3`](https://github.com/kumixlabs/toolkits/commit/05716a3890c3db47ced8181e76d90a0f52e42975) Thanks [@kumixio](https://github.com/kumixio)! - Initial release of `@kumix/utils` — a cross-runtime library of client and server utilities for modern SaaS apps. Ships ESM-only builds via tsdown with full type declarations, `.` and `./server` entry points, and a comprehensive tested suite of helpers (crypto, http, url, datetime, string, validation, analytics, browser, and env).
