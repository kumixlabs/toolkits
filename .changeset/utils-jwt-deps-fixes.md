---
"@kumix/utils": patch
---

Fix JWT verification error message to cover both bad signature and malformed token. Reclassify `bcryptjs`/`jsonwebtoken` as devDependencies (bundled by tsdown into server output). Pin `chrono-node` to `^2.9.1`. Replace `any[]` with `never[]` in debounce/throttle generic constraints. Add comprehensive test coverage for `deepEqual` (Map/Set/Date/RegExp/Array), `isIframeable`, and `getClientIPFromHeaders`.
