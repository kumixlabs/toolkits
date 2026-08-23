---
"@kumix/utils": minor
---

Breaking: `hashPassword` and `generateJWT` now throw on invalid input instead of returning `null`. Rule: generation functions throw on misuse (caller bug), verification functions keep returning `{ isValid, error }` result objects. Update null-checks to try/catch.
