---
"@kumix/utils": patch
---

Refactor random string and secure password generation to use `globalThis.crypto.getRandomValues` instead of `node:crypto`, enabling cross-runtime support (Node, Bun, Deno, Cloudflare Workers).
