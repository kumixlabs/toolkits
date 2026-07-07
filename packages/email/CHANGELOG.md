# @kumix/email

## 0.1.2

### Patch Changes

- [`70db108`](https://github.com/kumixlabs/toolkits/commit/70db108655ec33124b44573370f25328b6cd615b) Thanks [@kumixio](https://github.com/kumixio)! - Fix the Nodemailer provider dropping `tags` and priority: tags are now forwarded as `X-Tag-*` headers and the numeric `X-Priority` header is always set, matching the Resend provider's behaviour. Also clarified the misleading comment in the Resend `validateConfig` (it performs a format check only and never contacts the API).

## 0.1.1

### Patch Changes

- [`fb6c76d`](https://github.com/kumixlabs/toolkits/commit/fb6c76dbbf80af936474261161f1eb4acf920f59) Thanks [@kumixio](https://github.com/kumixio)! - Dynamic import for react/react-email/resend to prevent crashes on partial peer installs. Lazy Resend client initialization. Case-insensitive `SECURE` env parsing. Removed 6 unused deprecated email template types. Recipient sanitization in nodemailer provider.

## 0.1.0

### Minor Changes

- [`05716a3`](https://github.com/kumixlabs/toolkits/commit/05716a3890c3db47ced8181e76d90a0f52e42975) Thanks [@kumixio](https://github.com/kumixio)! - Initial release of `@kumix/email` — Resend and Nodemailer email utilities with React Email template rendering. Ships ESM-only builds via tsdown with full type declarations and `.`, `./components`, and `./helpers` entry points.
