import type React from "react";

import { htmlToText, renderEmailTemplate } from "./helpers";
import { NodemailerProvider } from "./providers/nodemailer";
import { ResendProvider } from "./providers/resend";
import type {
  EmailConfig,
  EmailResult,
  EmailTemplateData,
  EmailValidationResult,
  IEmailProvider,
  SendEmailOptions,
} from "./types";

export class EmailService {
  private provider: IEmailProvider;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: EmailConfig): IEmailProvider {
    // The `switch` narrows `config` to the concrete variant; no cast needed.
    switch (config.provider) {
      case "resend":
        return new ResendProvider(config);
      case "nodemailer":
        return new NodemailerProvider(config);
      default: {
        // Exhaustiveness check — if a new provider is added to the union
        // without a case here, this assignment fails to type-check.
        const _exhaustive: never = config;
        throw new Error(`Unsupported email provider: ${(_exhaustive as EmailConfig).provider}`);
      }
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    return this.provider.send(options);
  }

  async sendTemplate<T extends EmailTemplateData>(
    Template: React.ComponentType<T>,
    props: T,
    options: Omit<SendEmailOptions, "html" | "text">,
  ): Promise<EmailResult> {
    try {
      const html = await renderEmailTemplate(Template, props);
      const text = htmlToText(html);

      return this.sendEmail({ ...options, html, text });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to render template",
      };
    }
  }

  /**
   * Returns a deep copy of the current configuration. A shallow clone would
   * share the nested `from` / `smtp` / `auth` objects (which contain SMTP
   * credentials), letting callers accidentally mutate the service's config.
   */
  getConfig(): EmailConfig {
    return structuredClone(this.config);
  }

  updateConfig(config: EmailConfig): void {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  async validateConfig(): Promise<EmailValidationResult> {
    if (this.provider.validateConfig) {
      return this.provider.validateConfig();
    }
    return { valid: true };
  }
}
