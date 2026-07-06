import type { ConfigValidationResult, EmailConfig, NodemailerConfig, ResendConfig } from "./types";

/**
 * Cross-runtime environment record.
 * Pass `process.env` on Node.js, `ctx.env` on Cloudflare Workers,
 * `Deno.env.toObject()` on Deno, or a plain object in the browser.
 */
export type EnvRecord = Record<string, string | undefined>;

function getDefaultEnv(): EnvRecord | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env as EnvRecord;
  }
  return undefined;
}

function resolveEnv(env?: EnvRecord): EnvRecord | undefined {
  return env ?? getDefaultEnv();
}

export function loadResendConfig(env?: EnvRecord): ResendConfig | null {
  const e = resolveEnv(env);
  if (!e) return null;

  // Trim before the presence check so whitespace-only values are not accepted
  // as valid (previously `"   "` passed and produced a config with empty
  // credentials). Do NOT trim `apiKey`/`pass` — leading/trailing characters
  // can be meaningful in tokens.
  const apiKey = e.KUMIX_EMAIL_RESEND_API_KEY ?? e.RESEND_API_KEY;
  const fromName = (e.KUMIX_EMAIL_FROM_NAME ?? e.EMAIL_FROM_NAME)?.trim();
  const fromEmail = (e.KUMIX_EMAIL_FROM_EMAIL ?? e.EMAIL_FROM_EMAIL)?.trim();
  const replyTo = (e.KUMIX_EMAIL_REPLY_TO ?? e.EMAIL_REPLY_TO)?.trim();

  if (!apiKey || !fromName || !fromEmail) return null;

  return { provider: "resend", apiKey, from: { name: fromName, email: fromEmail }, replyTo };
}

export function loadNodemailerConfig(env?: EnvRecord): NodemailerConfig | null {
  const e = resolveEnv(env);
  if (!e) return null;

  const host = (e.KUMIX_EMAIL_SMTP_HOST ?? e.SMTP_HOST)?.trim();
  const port = e.KUMIX_EMAIL_SMTP_PORT ?? e.SMTP_PORT;
  const secure = e.KUMIX_EMAIL_SMTP_SECURE ?? e.SMTP_SECURE;
  const user = e.KUMIX_EMAIL_SMTP_USER ?? e.SMTP_USER;
  const pass = e.KUMIX_EMAIL_SMTP_PASS ?? e.SMTP_PASS;
  const fromName = (e.KUMIX_EMAIL_FROM_NAME ?? e.EMAIL_FROM_NAME)?.trim();
  const fromEmail = (e.KUMIX_EMAIL_FROM_EMAIL ?? e.EMAIL_FROM_EMAIL)?.trim();
  const replyTo = (e.KUMIX_EMAIL_REPLY_TO ?? e.EMAIL_REPLY_TO)?.trim();

  if (!host || !port || !user || !pass || !fromName || !fromEmail) return null;

  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) return null;

  // Lowercase once so capitalized spellings ("True", "TRUE") also enable TLS.
  const secureNorm = typeof secure === "string" ? secure.toLowerCase() : "";

  return {
    provider: "nodemailer",
    from: { name: fromName, email: fromEmail },
    replyTo,
    smtp: {
      host,
      port: parsedPort,
      secure: secureNorm === "true" || secureNorm === "1" || secureNorm === "yes",
      auth: { user, pass },
    },
  };
}

export function loadEmailConfig(env?: EnvRecord): EmailConfig | null {
  const e = resolveEnv(env);
  if (!e) return null;
  return loadResendConfig(e) || loadNodemailerConfig(e);
}

export function hasEmailConfig(env?: EnvRecord): boolean {
  return loadEmailConfig(env) !== null;
}

export function getEmailEnvVars(env?: EnvRecord): Record<string, string | undefined> {
  const e = resolveEnv(env);
  if (!e) return {};

  return {
    KUMIX_EMAIL_FROM_NAME: e.KUMIX_EMAIL_FROM_NAME,
    KUMIX_EMAIL_FROM_EMAIL: e.KUMIX_EMAIL_FROM_EMAIL,
    KUMIX_EMAIL_REPLY_TO: e.KUMIX_EMAIL_REPLY_TO,
    KUMIX_EMAIL_RESEND_API_KEY: e.KUMIX_EMAIL_RESEND_API_KEY ? "***" : undefined,
    KUMIX_EMAIL_SMTP_HOST: e.KUMIX_EMAIL_SMTP_HOST,
    KUMIX_EMAIL_SMTP_PORT: e.KUMIX_EMAIL_SMTP_PORT,
    KUMIX_EMAIL_SMTP_SECURE: e.KUMIX_EMAIL_SMTP_SECURE,
    KUMIX_EMAIL_SMTP_USER: e.KUMIX_EMAIL_SMTP_USER,
    KUMIX_EMAIL_SMTP_PASS: e.KUMIX_EMAIL_SMTP_PASS ? "***" : undefined,
  };
}

export function validateResendEnvVars(env?: EnvRecord): ConfigValidationResult {
  const e = resolveEnv(env);
  if (!e) return { valid: false, missing: ["env"], errors: ["No environment source available"] };

  const missing: string[] = [];
  const errors: string[] = [];

  if (!e.KUMIX_EMAIL_RESEND_API_KEY && !e.RESEND_API_KEY) {
    missing.push("KUMIX_EMAIL_RESEND_API_KEY or RESEND_API_KEY");
  }
  if (!e.KUMIX_EMAIL_FROM_NAME && !e.EMAIL_FROM_NAME) {
    missing.push("KUMIX_EMAIL_FROM_NAME or EMAIL_FROM_NAME");
  }
  if (!e.KUMIX_EMAIL_FROM_EMAIL && !e.EMAIL_FROM_EMAIL) {
    missing.push("KUMIX_EMAIL_FROM_EMAIL or EMAIL_FROM_EMAIL");
  }

  return { valid: missing.length === 0 && errors.length === 0, missing, errors };
}

export function validateNodemailerEnvVars(env?: EnvRecord): ConfigValidationResult {
  const e = resolveEnv(env);
  if (!e) return { valid: false, missing: ["env"], errors: ["No environment source available"] };

  const missing: string[] = [];
  const errors: string[] = [];

  if (!e.KUMIX_EMAIL_SMTP_HOST && !e.SMTP_HOST) missing.push("KUMIX_EMAIL_SMTP_HOST or SMTP_HOST");
  if (!e.KUMIX_EMAIL_SMTP_PORT && !e.SMTP_PORT) missing.push("KUMIX_EMAIL_SMTP_PORT or SMTP_PORT");
  if (!e.KUMIX_EMAIL_SMTP_USER && !e.SMTP_USER) missing.push("KUMIX_EMAIL_SMTP_USER or SMTP_USER");
  if (!e.KUMIX_EMAIL_SMTP_PASS && !e.SMTP_PASS) missing.push("KUMIX_EMAIL_SMTP_PASS or SMTP_PASS");
  if (!e.KUMIX_EMAIL_FROM_NAME && !e.EMAIL_FROM_NAME)
    missing.push("KUMIX_EMAIL_FROM_NAME or EMAIL_FROM_NAME");
  if (!e.KUMIX_EMAIL_FROM_EMAIL && !e.EMAIL_FROM_EMAIL)
    missing.push("KUMIX_EMAIL_FROM_EMAIL or EMAIL_FROM_EMAIL");

  const port = e.KUMIX_EMAIL_SMTP_PORT || e.SMTP_PORT;
  if (port && (Number.isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
    errors.push("SMTP_PORT must be a valid port number (1-65535)");
  }

  return { valid: missing.length === 0 && errors.length === 0, missing, errors };
}

export function validateEmailEnvVars(env?: EnvRecord): ConfigValidationResult {
  const validations = [validateResendEnvVars(env), validateNodemailerEnvVars(env)];
  const validProvider = validations.find((v) => v.valid);
  if (validProvider) return validProvider;

  const missing = [...new Set(validations.flatMap((v) => v.missing))];
  const errors = [...new Set(validations.flatMap((v) => v.errors))];
  return { valid: false, missing, errors };
}
