/**
 * Resend email provider implementation
 * Provides email sending functionality using the Resend service
 */

import type { CreateEmailOptions, Resend } from "resend";

import { formatEmailAddress, stripCrlf } from "../helpers";
import type {
  EmailResult,
  EmailValidationResult,
  IEmailProvider,
  ResendConfig,
  SendEmailOptions,
} from "../types";

/**
 * Resend email provider implementation
 * @public
 *
 * @example
 * ```typescript
 * import { ResendProvider } from '@kumix/email';
 *
 * const provider = new ResendProvider({
 *   provider: 'resend',
 *   apiKey: 'your-resend-api-key',
 *   from: {
 *     name: 'Your App',
 *     email: 'noreply@yourapp.com'
 *   }
 * });
 *
 * const result = await provider.send({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   html: '<h1>Hello World</h1>'
 * });
 *
 * if (result.success) {
 *   console.log('Email sent with ID:', result.messageId);
 * } else {
 *   console.error('Failed to send email:', result.error);
 * }
 * ```
 */
export class ResendProvider implements IEmailProvider {
  private _client: Resend | null = null;
  private config: ResendConfig;

  /**
   * Create a new Resend provider instance
   * @param config Resend configuration including API key and sender info
   * @throws Error if API key is missing
   */
  constructor(config: ResendConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error("Resend API key is required");
    }
  }

  // The SDK is loaded lazily so the `resend` peer dep isn't required at module
  // load time. This lets consumers who only use Nodemailer import the package
  // without installing `resend`.
  private async getClient(): Promise<Resend> {
    if (this._client) return this._client;
    const { Resend } = await import("resend");
    this._client = new Resend(this.config.apiKey);
    return this._client;
  }

  /**
   * Validate Resend configuration
   * @returns Promise resolving to validation result
   * @public
   *
   * @example
   * ```typescript
   * const validation = await provider.validateConfig();
   * if (!validation.valid) {
   *   console.error('Configuration error:', validation.error);
   * } else {
   *   console.log('Resend configuration is valid');
   * }
   * ```
   */
  async validateConfig(): Promise<EmailValidationResult> {
    try {
      if (!this.config.apiKey) {
        return {
          valid: false,
          error: "Resend API key is required",
        };
      }

      if (!this.config.from.email || !this.config.from.name) {
        return {
          valid: false,
          error: "From email and name are required",
        };
      }

      // Test API key by making a simple request
      // Note: Resend doesn't have a dedicated validation endpoint,
      // so we'll just check if the API key format is valid
      if (!this.config.apiKey.startsWith("re_")) {
        return {
          valid: false,
          error: "Invalid Resend API key format",
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown validation error",
      };
    }
  }

  /**
   * Send an email using Resend
   * @param options Email sending options
   * @returns Promise resolving to email sending result
   * @public
   *
   * @example
   * ```typescript
   * const result = await provider.send({
   *   to: ['user1@example.com', 'user2@example.com'],
   *   cc: 'manager@example.com',
   *   subject: 'Important Update',
   *   html: '<h1>Hello</h1><p>This is an important update.</p>',
   *   text: 'Hello\n\nThis is an important update.',
   *   attachments: [{
   *     filename: 'document.pdf',
   *     content: pdfBuffer,
   *     contentType: 'application/pdf'
   *   }],
   *   tags: {
   *     category: 'notification',
   *     priority: 'high'
   *   }
   * });
   *
   * if (result.success) {
   *   console.log('Email sent with ID:', result.messageId);
   * } else {
   *   console.error('Failed to send email:', result.error);
   * }
   * ```
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Build the message body. Resend requires at least one of html/text/react/template,
      // and forcing `text: ""` would suppress its automatic text generation from html.
      // - When `html` is provided, send `html` (Resend derives the text part). If the
      //   caller also provided an explicit `text`, send that too instead of the derived one.
      // - When no `html` is provided, fall back to `text` (empty string as the last resort).
      const base = {
        // Route `from` through formatEmailAddress so the display name is
        // quoted/escaped and CR/LF is stripped (header-injection hardening).
        from: formatEmailAddress(this.config.from.name, this.config.from.email),
        to: (Array.isArray(options.to) ? options.to : [options.to]).map(stripCrlf),
        subject: options.subject.replace(/[\r\n]/g, ""),
      };

      const emailData: CreateEmailOptions = options.html
        ? { ...base, html: options.html, ...(options.text ? { text: options.text } : {}) }
        : { ...base, text: options.text || "" };

      if (options.cc) {
        emailData.cc = (Array.isArray(options.cc) ? options.cc : [options.cc]).map(stripCrlf);
      }

      if (options.bcc) {
        emailData.bcc = (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map(stripCrlf);
      }

      if (this.config.replyTo) {
        emailData.replyTo = stripCrlf(this.config.replyTo);
      }

      if (options.headers) {
        const sanitizedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(options.headers)) {
          sanitizedHeaders[key] = String(value).replace(/[\r\n]/g, "");
        }
        emailData.headers = sanitizedHeaders;
      }

      if (options.tags) {
        emailData.tags = Object.entries(options.tags).map(([name, value]) => ({
          name,
          value: String(value),
        }));
      }

      if (options.attachments) {
        emailData.attachments = options.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content as string | Buffer,
          content_type: attachment.contentType,
          cid: attachment.cid,
        }));
      }

      // Forward scheduled delivery to Resend (`scheduled_at`). Previously this
      // option was silently dropped and emails were sent immediately even when
      // the caller asked for a future delivery time.
      if (options.scheduledAt) {
        emailData.scheduledAt = options.scheduledAt.toISOString();
      }

      // Forward priority (1=highest .. 5=lowest) via the standard X-Priority
      // header, since Resend has no dedicated field for it.
      if (options.priority) {
        const headers = emailData.headers ?? {};
        headers["X-Priority"] = String(options.priority);
        emailData.headers = headers;
      }

      const resend = await this.getClient();
      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
