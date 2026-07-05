import type React from "react";

import { htmlToText, renderEmailTemplate } from "./helpers";
import { NodemailerProvider } from "./providers/nodemailer";
import { ResendProvider } from "./providers/resend";
import type {
  EmailConfig,
  EmailResult,
  EmailTemplateData,
  IEmailProvider,
  NodemailerConfig,
  ResendConfig,
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
    switch (config.provider) {
      case "resend":
        return new ResendProvider(config as ResendConfig);
      case "nodemailer":
        return new NodemailerProvider(config as NodemailerConfig);
      default:
        throw new Error(`Unsupported email provider: ${(config as EmailConfig).provider}`);
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

  getConfig(): EmailConfig {
    return { ...this.config };
  }

  updateConfig(config: EmailConfig): void {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  async validateConfig() {
    if (this.provider.validateConfig) {
      return this.provider.validateConfig();
    }
    return { valid: true };
  }
}
