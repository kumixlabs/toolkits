---
"@kumix/email": patch
---

Fix the Nodemailer provider dropping `tags` and priority: tags are now forwarded as `X-Tag-*` headers and the numeric `X-Priority` header is always set, matching the Resend provider's behaviour. Also clarified the misleading comment in the Resend `validateConfig` (it performs a format check only and never contacts the API).
