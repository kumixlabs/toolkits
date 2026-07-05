# @kumix/email

[![Version](https://img.shields.io/npm/v/@kumix/email.svg)](https://www.npmjs.com/package/@kumix/email)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A flexible email package for SaaS applications. Supports Resend and Nodemailer/SMTP, React
Email templates, and all JavaScript runtimes.

## Installation

```bash
# Node.js / Bun
bun add @kumix/email resend
# or
npm install @kumix/email resend

# Optional: install nodemailer for SMTP (Node.js / Bun / Deno only)
bun add nodemailer
```

## Configuration by Runtime

### Node.js / Bun

Set environment variables and call `createEmail()` — it auto-detects your provider.

```bash
# .env
KUMIX_EMAIL_RESEND_API_KEY=re_xxxx
KUMIX_EMAIL_FROM_NAME=My App
KUMIX_EMAIL_FROM_EMAIL=noreply@myapp.com
KUMIX_EMAIL_REPLY_TO=support@myapp.com
```

```typescript
import { createEmail } from "@kumix/email";

// Reads process.env automatically
const email = createEmail();

await email.sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello World</h1>",
});
```

Bun works identically to Node.js — `process.env` is natively supported.

### Cloudflare Workers

Pass `ctx.env` as the second argument. Resend only (Nodemailer is Node-only).

```toml
# wrangler.toml
[vars]
KUMIX_EMAIL_RESEND_API_KEY = "re_xxxx"
KUMIX_EMAIL_FROM_NAME = "My App"
KUMIX_EMAIL_FROM_EMAIL = "noreply@myapp.com"
```

```typescript
// worker.ts
import { createEmail, type EnvRecord } from "@kumix/email";

interface Env extends EnvRecord {
  KUMIX_EMAIL_RESEND_API_KEY: string;
  KUMIX_EMAIL_FROM_NAME: string;
  KUMIX_EMAIL_FROM_EMAIL: string;
}

export default {
  async fetch(req: Request, env: Env) {
    const email = createEmail(undefined, env);

    await email.sendEmail({
      to: "user@example.com",
      subject: "Hello from Workers!",
      html: "<p>Sent from Cloudflare Workers</p>",
    });

    return new Response("Email sent");
  },
};
```

With React templates in Workers:

```typescript
import { createEmail, type EnvRecord } from "@kumix/email";

interface WelcomeProps {
  userName: string;
  loginUrl: string;
}

const WelcomeEmail: React.FC<WelcomeProps> = ({ userName, loginUrl }) => (
  <div>
    <h1>Welcome, {userName}!</h1>
    <a href={loginUrl}>Login here</a>
  </div>
);

export default {
  async fetch(req: Request, env: Env) {
    const email = createEmail(undefined, env);

    await email.sendTemplate(
      WelcomeEmail,
      { userName: "Alice", loginUrl: "https://app.example.com" },
      { to: "alice@example.com", subject: "Welcome!" },
    );

    return new Response("Template email sent");
  },
};
```

### Deno

Deno supports `process.env` natively (requires `--allow-env`). You can also pass env explicitly.

```bash
# .env
KUMIX_EMAIL_RESEND_API_KEY=re_xxxx
KUMIX_EMAIL_FROM_NAME=My App
KUMIX_EMAIL_FROM_EMAIL=noreply@myapp.com
```

```typescript
// main.ts
import { createEmail } from "@kumix/email";

// Option A: let the package read process.env (Deno supports it)
const email = createEmail();

// Option B: pass env explicitly
const email = createEmail(undefined, Deno.env.toObject());

await email.sendEmail({
  to: "user@example.com",
  subject: "Hello from Deno!",
  html: "<h1>Deno works</h1>",
});
```

```bash
deno run --allow-env --allow-net main.ts
```

With Nodemailer (SMTP) in Deno:

```typescript
import { createNodemailer } from "@kumix/email";

const email = createNodemailer({
  from: { name: "My App", email: "noreply@myapp.com" },
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "you@gmail.com", pass: "app-password" },
  },
});

await email.sendEmail({
  to: "user@example.com",
  subject: "SMTP from Deno",
  html: "<p>Sent via SMTP</p>",
});
```

### Browser

Use manual config — no env vars. Resend only, since Nodemailer requires Node.js APIs.

```typescript
import { createResend } from "@kumix/email";

const email = createResend({
  apiKey: "re_xxxx",
  from: { name: "My App", email: "noreply@myapp.com" },
});

await email.sendEmail({
  to: "user@example.com",
  subject: "Hello from the browser!",
  html: "<p>Sent from client-side JavaScript</p>",
});
```

> **Security note**: Exposing your Resend API key in browser code is insecure. Use this
> pattern behind an authenticated route in an admin dashboard, or proxy through your backend.

### Manual Configuration (any runtime)

Skip env vars entirely — pass your config object directly. Works in every runtime.

```typescript
import { createResend, createNodemailer } from "@kumix/email";

// Resend — works everywhere
const resend = createResend({
  apiKey: "re_xxxx",
  from: { name: "My App", email: "noreply@myapp.com" },
});

// Nodemailer — Node.js / Bun / Deno only
const nodemailer = createNodemailer({
  from: { name: "My App", email: "noreply@myapp.com" },
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "you@gmail.com", pass: "app-password" },
  },
});
```

## `EnvRecord` Pattern

All config and factory functions accept an optional `env` parameter of type
`Record<string, string | undefined>`. On Node.js / Bun it defaults to
`process.env`. On other runtimes, pass your environment explicitly:

```typescript
import {
  createEmail,
  createResend,
  hasEmailConfig,
  loadEmailConfig,
  validateEmailEnvVars,
  type EnvRecord,
} from "@kumix/email";

// All accept env as the last argument:
const email = createEmail(undefined, myEnv);
const config = loadEmailConfig(myEnv);
const ready = hasEmailConfig(myEnv);
const result = validateEmailEnvVars(myEnv);
```

## Sending Emails

### HTML Emails

```typescript
await email.sendEmail({
  to: "user@example.com",
  subject: "Hello!",
  html: "<p>This is an HTML email</p>",
  text: "This is the plain text version",
});
```

### React Templates

```typescript
import { EmailTemplate } from "./templates/EmailTemplate";

await email.sendTemplate(
  EmailTemplate,
  { userName: "John", resetLink: "https://..." },
  { to: "user@example.com", subject: "Password Reset" },
);
```

### Advanced Options

```typescript
await email.sendEmail({
  to: ["user1@example.com", "user2@example.com"],
  cc: "manager@example.com",
  bcc: "admin@example.com",
  subject: "Important Update",
  html: "<h1>Update</h1>",
  attachments: [
    {
      filename: "document.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
  headers: { "X-Custom-Header": "value" },
  tags: { category: "notification" },
});
```

## Runtime Compatibility

| Feature             | Node.js | Bun | CF Workers | Deno | Browser |
| ------------------- | ------- | --- | ---------- | ---- | ------- |
| Resend provider     | Yes     | Yes | Yes        | Yes  | Yes     |
| Nodemailer/SMTP     | Yes     | Yes | No         | Yes  | No      |
| `createEmail()`     | Yes     | Yes | Yes\*      | Yes  | No      |
| Manual config       | Yes     | Yes | Yes        | Yes  | Yes     |
| React templates     | Yes     | Yes | Yes        | Yes  | Yes     |
| Env auto-detection  | Yes     | Yes | No†        | Yes  | No      |
| `helpers` subpath   | Yes     | Yes | Yes        | Yes  | Yes     |
| `components` export | Yes     | Yes | Yes        | Yes  | Yes     |

\* Pass env as second argument: `createEmail(undefined, ctx.env)`.
† Pass `env` explicitly via `EnvRecord` pattern.

## API Reference

### Factory Functions

- `createEmail(config?, env?)` — Create from config or env, auto-detects provider
- `createResend(config?, env?)` — Create Resend email service
- `createNodemailer(config?, env?)` — Create Nodemailer email service
- `isEmailConfigured(env?)` — Check if email is configured via env
- `getConfiguredProvider(env?)` — Get the detected provider from env

### EmailService Methods

- `sendEmail(options)` — Send HTML/text email
- `sendTemplate(component, props, options)` — Send React template email
- `getConfig()` — Get current configuration
- `updateConfig(config)` — Update configuration at runtime
- `validateConfig()` — Validate current configuration

### Config Helpers

- `loadEmailConfig(env?)` — Auto-detect and load config from env
- `loadResendConfig(env?)` — Load Resend config from env
- `loadNodemailerConfig(env?)` — Load SMTP config from env
- `validateEmailEnvVars(env?)` — Validate any configured provider
- `validateResendEnvVars(env?)` — Validate Resend env vars
- `validateNodemailerEnvVars(env?)` — Validate SMTP env vars
- `getEmailEnvVars(env?)` — Get env vars with secrets masked
- `hasEmailConfig(env?)` — Check if any provider is configured

### Helpers (`@kumix/email/helpers`)

- `renderEmailTemplate(Component, props)` — Render React component to HTML string
- `htmlToText(html)` — Convert HTML to plain text
- `isValidEmail(email)` — Validate email format (RFC 5322)
- `validateEmails(emails)` — Validate single or multiple emails
- `filterValidEmails(emails)` — Filter invalid emails from a list
- `formatEmailAddress(name, email)` — Format as `Name <email>`
- `extractEmail(formatted)` — Extract email from formatted address
- `extractDisplayName(formatted)` — Extract display name from formatted address
- `sanitizeHtml(html)` — Strip dangerous HTML (scripts, event handlers)
- `truncateText(text, maxLength, ellipsis?)` — Truncate with ellipsis
- `generatePreviewText(html, maxLength?)` — Generate email preview text
- `generateUnsubscribeLink(baseUrl, email, token?)` — Create unsubscribe URL
- `generateTrackingPixel(baseUrl, emailId, recipientId)` — Create tracking pixel URL
- `addUtmParams(url, params)` — Add UTM tracking parameters
- `parseEmailList(str)` — Parse comma/semicolon-separated emails
- `deduplicateEmails(emails)` — Deduplicate (case-insensitive)
- `chunkEmails(emails, chunkSize?)` — Split into batches (default 100)
- `getMimeType(filename)` — Get MIME type from extension
- `formatFileSize(bytes, decimals?)` — Format file size in human-readable form

### Types

```typescript
import type {
  EmailConfig,
  ResendConfig,
  NodemailerConfig,
  SendEmailOptions,
  EmailResult,
  EmailProvider,
  EnvRecord,
  // ... and more
} from "@kumix/email";
```

## Environment Variables

| Variable                     | Provider   | Required |
| ---------------------------- | ---------- | -------- |
| `KUMIX_EMAIL_RESEND_API_KEY` | Resend     | Yes      |
| `KUMIX_EMAIL_FROM_NAME`      | All        | Yes      |
| `KUMIX_EMAIL_FROM_EMAIL`     | All        | Yes      |
| `KUMIX_EMAIL_REPLY_TO`       | All        | No       |
| `KUMIX_EMAIL_SMTP_HOST`      | Nodemailer | Yes      |
| `KUMIX_EMAIL_SMTP_PORT`      | Nodemailer | Yes      |
| `KUMIX_EMAIL_SMTP_SECURE`    | Nodemailer | No       |
| `KUMIX_EMAIL_SMTP_USER`      | Nodemailer | Yes      |
| `KUMIX_EMAIL_SMTP_PASS`      | Nodemailer | Yes      |

Legacy env vars (`RESEND_API_KEY`, `SMTP_HOST`, etc.) are also supported for backward compatibility.

## Links

- [npm Package](https://www.npmjs.com/package/@kumix/email)
- [Contributing Guide](../../CONTRIBUTING.md)
- [License](../../LICENSE)

## License

MIT © [Kumix Labs](../../LICENSE)
