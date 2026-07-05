/**
 * Resend email provider implementation
 * Provides email sending functionality using the Resend service
 */

import type { CreateEmailOptions } from "resend";
import { Resend } from "resend";

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
  private resend: Resend;
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

    this.resend = new Resend(config.apiKey);
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
      const emailData: CreateEmailOptions = {
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text || "",
      };

      if (options.cc) {
        emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }

      if (options.bcc) {
        emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }

      if (options.html) {
        emailData.html = options.html;
      }

      if (this.config.replyTo) {
        emailData.replyTo = this.config.replyTo;
      }

      if (options.headers) {
        emailData.headers = options.headers;
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

      const { data, error } = await this.resend.emails.send(emailData);

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
