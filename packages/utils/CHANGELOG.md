# @kumix/utils

## 0.3.0

### Minor Changes

- [`49bf203`](https://github.com/kumixlabs/toolkits/commit/49bf203977a6fcd605f23e41c384886ba114bf89) Thanks [@kumixio](https://github.com/kumixio)! - Replace `clsx` and `tailwind-merge` with `cn` package and move external libraries (`@paralleldrive/cuid2`, `@sindresorhus/slugify`, `chrono-node`, `cn`, `consola`, `ms`, `nanoid`) to `peerDependencies`

## 0.2.0

### Minor Changes

- [`9c306df`](https://github.com/kumixlabs/toolkits/commit/9c306df4bd173a96c9d72a4bd560a9137b661275) Thanks [@kumixio](https://github.com/kumixio)! - Breaking: `hashPassword` and `generateJWT` now throw on invalid input instead of returning `null`. Rule: generation functions throw on misuse (caller bug), verification functions keep returning `{ isValid, error }` result objects. Update null-checks to try/catch.

### Patch Changes

- [`9c306df`](https://github.com/kumixlabs/toolkits/commit/9c306df4bd173a96c9d72a4bd560a9137b661275) Thanks [@kumixio](https://github.com/kumixio)! - Fix `generateJWT` dropping caller-supplied `exp` claim, which produced non-expiring tokens when `exp` was passed

- [`9c306df`](https://github.com/kumixlabs/toolkits/commit/9c306df4bd173a96c9d72a4bd560a9137b661275) Thanks [@kumixio](https://github.com/kumixio)! - Remove unused `base-x` dependency

- [`9c306df`](https://github.com/kumixlabs/toolkits/commit/9c306df4bd173a96c9d72a4bd560a9137b661275) Thanks [@kumixio](https://github.com/kumixio)! - Fix modulo bias in `generateSecurePassword` by using rejection sampling (discarding Uint32 values above the largest multiple of the charset length)

## 0.1.3

### Patch Changes

- [`3e81f8b`](https://github.com/kumixlabs/toolkits/commit/3e81f8beb5c6482c444a027da0d40d89a08eed7d) Thanks [@kumixio](https://github.com/kumixio)! - Refactor random string and secure password generation to use `globalThis.crypto.getRandomValues` instead of `node:crypto`, enabling cross-runtime support (Node, Bun, Deno, Cloudflare Workers).

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
