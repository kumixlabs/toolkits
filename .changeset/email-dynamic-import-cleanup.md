---
"@kumix/email": patch
---

Dynamic import for react/react-email/resend to prevent crashes on partial peer installs. Lazy Resend client initialization. Case-insensitive `SECURE` env parsing. Removed 6 unused deprecated email template types. Recipient sanitization in nodemailer provider.
