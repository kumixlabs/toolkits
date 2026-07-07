# @kumix/utils

## 0.1.2

### Patch Changes

- [`70db108`](https://github.com/kumixlabs/toolkits/commit/70db108655ec33124b44573370f25328b6cd615b) Thanks [@kumixio](https://github.com/kumixio)! - Fix several correctness bugs and inconsistencies:

  - `formatFileSize`: clamp the unit index so sub-byte values (e.g. `0.5`) no longer render as `"0.5 undefined"`.
  - `uid`: concatenate the timestamp with a zero-padded random suffix instead of adding them, avoiding heavy collisions within the same millisecond.
  - `isValidIP`: accept compressed and IPv4-mapped IPv6 addresses (e.g. `2001:db8::1`) instead of only the full 8-group form.
  - `assetsUrl`: stop overriding the caller-supplied `host` with the env value.
  - `baseId`/`baseIdCustom`: encode ULIDs with a fixed-length 26-char Crockford base32 encoder so IDs stay lexicographically time-sortable (previous `base-x` output had variable length).
  - Route `fetcher` and `getIPAddress` logging through the shared `logger` instead of `console.*`.
  - `normalizeString`: guard `process.env` access with `typeof process` for cross-runtime safety.
  - `getTimeZones`: include the `numericOffset` field in the return type to match the runtime shape.

## 0.1.1

### Patch Changes

- [`fb6c76d`](https://github.com/kumixlabs/toolkits/commit/fb6c76dbbf80af936474261161f1eb4acf920f59) Thanks [@kumixio](https://github.com/kumixio)! - Fix JWT verification error message to cover both bad signature and malformed token. Reclassify `bcryptjs`/`jsonwebtoken` as devDependencies (bundled by tsdown into server output). Pin `chrono-node` to `^2.9.1`. Replace `any[]` with `never[]` in debounce/throttle generic constraints. Add comprehensive test coverage for `deepEqual` (Map/Set/Date/RegExp/Array), `isIframeable`, and `getClientIPFromHeaders`.

## 0.1.0

### Minor Changes

- [`05716a3`](https://github.com/kumixlabs/toolkits/commit/05716a3890c3db47ced8181e76d90a0f52e42975) Thanks [@kumixio](https://github.com/kumixio)! - Initial release of `@kumix/utils` — a cross-runtime library of client and server utilities for modern SaaS apps. Ships ESM-only builds via tsdown with full type declarations, `.` and `./server` entry points, and a comprehensive tested suite of helpers (crypto, http, url, datetime, string, validation, analytics, browser, and env).
