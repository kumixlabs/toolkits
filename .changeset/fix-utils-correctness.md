---
"@kumix/utils": patch
---

Fix several correctness bugs and inconsistencies:

- `formatFileSize`: clamp the unit index so sub-byte values (e.g. `0.5`) no longer render as `"0.5 undefined"`.
- `uid`: concatenate the timestamp with a zero-padded random suffix instead of adding them, avoiding heavy collisions within the same millisecond.
- `isValidIP`: accept compressed and IPv4-mapped IPv6 addresses (e.g. `2001:db8::1`) instead of only the full 8-group form.
- `assetsUrl`: stop overriding the caller-supplied `host` with the env value.
- `baseId`/`baseIdCustom`: encode ULIDs with a fixed-length 26-char Crockford base32 encoder so IDs stay lexicographically time-sortable (previous `base-x` output had variable length).
- Route `fetcher` and `getIPAddress` logging through the shared `logger` instead of `console.*`.
- `normalizeString`: guard `process.env` access with `typeof process` for cross-runtime safety.
- `getTimeZones`: include the `numericOffset` field in the return type to match the runtime shape.
