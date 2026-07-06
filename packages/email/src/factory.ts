import { type EnvRecord, hasEmailConfig, loadEmailConfig } from "./config";
import { EmailService } from "./services";
import type { EmailConfig, EmailProvider, NodemailerConfig, ResendConfig } from "./types";

export function createEmail(config?: EmailConfig, env?: EnvRecord): EmailService {
  if (config) return new EmailService(config);

  const envConfig = loadEmailConfig(env);
  if (!envConfig) {
    throw new Error(
      "No email configuration provided and none found in environment variables. " +
        "Please provide a config object or set environment variables like KUMIX_EMAIL_RESEND_API_KEY, etc.",
    );
  }
  return new EmailService(envConfig);
}

export function createResend(
  config?: Omit<ResendConfig, "provider"> & { provider?: "resend" },
  env?: EnvRecord,
): EmailService {
  if (config) return createEmail({ ...config, provider: "resend" });

  const envConfig = loadEmailConfig(env);
  if (envConfig?.provider === "resend") return createEmail(envConfig);

  throw new Error(
    "No Resend configuration found. Please provide config or set environment variables: " +
      "KUMIX_EMAIL_RESEND_API_KEY, KUMIX_EMAIL_FROM_NAME, KUMIX_EMAIL_FROM_EMAIL",
  );
}

export function createNodemailer(
  config?: Omit<NodemailerConfig, "provider"> & { provider?: "nodemailer" },
  env?: EnvRecord,
): EmailService {
  if (config) return createEmail({ ...config, provider: "nodemailer" });

  const envConfig = loadEmailConfig(env);
  if (envConfig?.provider === "nodemailer") return createEmail(envConfig);

  throw new Error(
    "No Nodemailer configuration found. Please provide config or set environment variables: " +
      "KUMIX_EMAIL_SMTP_HOST, KUMIX_EMAIL_SMTP_PORT, KUMIX_EMAIL_SMTP_USER, KUMIX_EMAIL_SMTP_PASS, KUMIX_EMAIL_FROM_NAME, KUMIX_EMAIL_FROM_EMAIL",
  );
}

export function isEmailConfigured(env?: EnvRecord): boolean {
  return hasEmailConfig(env);
}

export function getConfiguredProvider(env?: EnvRecord): EmailProvider | null {
  const config = loadEmailConfig(env);
  return config?.provider || null;
}
