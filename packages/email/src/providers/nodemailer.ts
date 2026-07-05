/** biome-ignore-all lint/suspicious/noExplicitAny: We need to use any to avoid type errors. */

import type {
  EmailResult,
  EmailValidationResult,
  IEmailProvider,
  NodemailerConfig,
  SendEmailOptions,
} from "../types";

export class NodemailerProvider implements IEmailProvider {
  private config: NodemailerConfig;
  private _transporter: any = null;

  constructor(config: NodemailerConfig) {
    this.config = config;
    if (!config.smtp) {
      throw new Error("SMTP configuration is required for Nodemailer");
    }
  }

  private async getTransporter(): Promise<any> {
    if (this._transporter) return this._transporter;

    let nodemailer: any;
    try {
      nodemailer = await import("nodemailer");
    } catch {
      throw new Error(
        "nodemailer is not available in this runtime. " +
          "Use a Node.js environment or provide a Resend configuration instead.",
      );
    }

    const mailer = nodemailer.default ?? nodemailer;
    this._transporter = mailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: {
        user: this.config.smtp.auth.user,
        pass: this.config.smtp.auth.pass,
      },
    });
    return this._transporter;
  }

  async validateConfig(): Promise<EmailValidationResult> {
    try {
      if (!this.config.smtp) {
        return { valid: false, error: "SMTP configuration is required" };
      }
      if (!this.config.smtp.host || !this.config.smtp.port) {
        return { valid: false, error: "SMTP host and port are required" };
      }
      if (!this.config.smtp.auth.user || !this.config.smtp.auth.pass) {
        return { valid: false, error: "SMTP authentication credentials are required" };
      }
      if (!this.config.from.email || !this.config.from.name) {
        return { valid: false, error: "From email and name are required" };
      }

      const transporter = await this.getTransporter();
      await transporter.verify();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "SMTP connection failed",
      };
    }
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const transporter = await this.getTransporter();
      const info: any = await transporter.sendMail({
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(", ")
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: this.config.replyTo,
        headers: options.headers,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content as any,
          contentType: a.contentType,
          cid: a.cid,
        })),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
