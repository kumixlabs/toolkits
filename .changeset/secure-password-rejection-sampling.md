---
"@kumix/utils": patch
---

Fix modulo bias in `generateSecurePassword` by using rejection sampling (discarding Uint32 values above the largest multiple of the charset length)
