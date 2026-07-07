/** biome-ignore-all lint/suspicious/noExplicitAny: We need to use any to avoid type errors. */

import { formatEmailAddress, stripCrlf } from "../helpers";
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

      // Build the outgoing headers up front so tags/priority can be merged in a
      // single place. SMTP has no native tag concept, so forward each tag as an
      // `X-Tag-<name>` header instead of silently dropping it (Resend forwards
      // tags natively).
      const headers: Record<string, string> = {};
      if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
          headers[k] = String(v).replace(/[\r\n]/g, "");
        }
      }
      if (options.tags) {
        for (const [name, value] of Object.entries(options.tags)) {
          headers[`X-Tag-${name.replace(/[\r\n]/g, "")}`] = String(value).replace(/[\r\n]/g, "");
        }
      }
      // Always also set the numeric X-Priority header for clients that ignore
      // the symbolic priority field.
      if (options.priority) {
        headers["X-Priority"] = String(options.priority);
      }

      const info: any = await transporter.sendMail({
        // Route `from` through formatEmailAddress so the display name is
        // quoted/escaped and CR/LF is stripped (header-injection hardening).
        from: formatEmailAddress(this.config.from.name, this.config.from.email),
        to: (Array.isArray(options.to) ? options.to : [options.to]).map(stripCrlf).join(", "),
        cc: options.cc
          ? (Array.isArray(options.cc) ? options.cc : [options.cc]).map(stripCrlf).join(", ")
          : undefined,
        bcc: options.bcc
          ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map(stripCrlf).join(", ")
          : undefined,
        subject: options.subject.replace(/[\r\n]/g, ""),
        html: options.html,
        text: options.text,
        // Forward priority (1=highest .. 5=lowest) — nodemailer supports both
        // `priority` (high/normal/low) and the X-Priority header.
        priority:
          options.priority === undefined
            ? undefined
            : options.priority <= 2
              ? "high"
              : options.priority >= 4
                ? "low"
                : "normal",
        replyTo: this.config.replyTo ? stripCrlf(this.config.replyTo) : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
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
