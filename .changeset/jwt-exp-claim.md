---
"@kumix/utils": patch
---

Fix `generateJWT` dropping caller-supplied `exp` claim, which produced non-expiring tokens when `exp` was passed
