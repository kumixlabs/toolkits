/**
 * Email service type definitions and interfaces
 * Provides comprehensive TypeScript types for email configuration, sending options, and results
 */

/**
 * Supported email service providers
 * @public
 */
export type EmailProvider = "resend" | "nodemailer";

/**
 * Base email configuration interface
 * Common properties shared by all email providers
 * @public
 */
export interface BaseEmailConfig {
  /** Email service provider */
  provider: EmailProvider;
  /** Default sender information */
  from: {
    /** Sender name */
    name: string;
    /** Sender email address */
    email: string;
  };
  /** Reply-to email address */
  replyTo?: string;
}

/**
 * Resend email service configuration
 * @public
 */
export interface ResendConfig extends BaseEmailConfig {
  provider: "resend";
  /** Resend API key */
  apiKey: string;
}

/**
 * Nodemailer/SMTP email service configuration
 * @public
 */
export interface NodemailerConfig extends BaseEmailConfig {
  provider: "nodemailer";
  /** SMTP server configuration */
  smtp: {
    /** SMTP server hostname */
    host: string;
    /** SMTP server port */
    port: number;
    /** Use secure connection (TLS) */
    secure: boolean;
    /** Authentication credentials */
    auth: {
      /** SMTP username */
      user: string;
      /** SMTP password */
      pass: string;
    };
  };
}

/**
 * Union type for all email configurations
 * @public
 */
export type EmailConfig = ResendConfig | NodemailerConfig;

/**
 * Email attachment configuration
 * @public
 */
export interface EmailAttachment {
  /** Attachment filename */
  filename: string;
  /** Attachment content as Uint8Array, Buffer, or string */
  content: Uint8Array | string;
  /** MIME type of the attachment */
  contentType?: string;
  /** Content-ID for inline images */
  cid?: string;
}

/**
 * Email sending options
 * @public
 */
export interface SendEmailOptions {
  /** Recipient email address(es) */
  to: string | string[];
  /** CC recipient email address(es) */
  cc?: string | string[];
  /** BCC recipient email address(es) */
  bcc?: string | string[];
  /** Email subject line */
  subject: string;
  /** HTML content of the email */
  html?: string;
  /** Plain text content of the email */
  text?: string;
  /** Email attachments */
  attachments?: EmailAttachment[];
  /** Custom email headers */
  headers?: Record<string, string>;
  /** Email tags for tracking and analytics */
  tags?: Record<string, string>;
  /** Email priority (1=highest, 3=normal, 5=lowest) */
  priority?: 1 | 2 | 3 | 4 | 5;
  /** Schedule email delivery for later */
  scheduledAt?: Date;
}

/**
 * Email template data interface
 * @public
 */
export interface EmailTemplateData {
  /** Template data properties */
  [key: string]: unknown;
}

/**
 * Email sending result
 * @public
 */
export interface EmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Unique message ID from the email provider */
  messageId?: string;
  /** Error message if sending failed */
  error?: string;
  /** Additional metadata from the provider */
  metadata?: Record<string, unknown>;
}

/**
 * Email validation result
 * @public
 */
export interface EmailValidationResult {
  /** Whether the email address is valid */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Email service provider interface
 * @public
 */
export interface IEmailProvider {
  /** Send an email */
  send(options: SendEmailOptions): Promise<EmailResult>;
  /** Validate provider configuration */
  validateConfig?(): Promise<EmailValidationResult>;
}

/**
 * Email template options
 * @public
 */
export interface EmailTemplateOptions {
  /** Template name or ID */
  template: string;
  /** Template data/variables */
  data: EmailTemplateData;
  /** Recipient email address(es) */
  to: string | string[];
  /** CC recipient email address(es) */
  cc?: string | string[];
  /** BCC recipient email address(es) */
  bcc?: string | string[];
  /** Email subject (if not defined in template) */
  subject?: string;
  /** Email attachments */
  attachments?: EmailAttachment[];
  /** Custom email headers */
  headers?: Record<string, string>;
  /** Email tags for tracking and analytics */
  tags?: Record<string, string>;
}

/**
 * Bulk email sending options
 * @public
 */
export interface BulkEmailOptions {
  /** Array of email sending options */
  emails: SendEmailOptions[];
  /** Batch size for sending (default: 100) */
  batchSize?: number;
  /** Delay between batches in milliseconds (default: 1000) */
  batchDelay?: number;
}

/**
 * Bulk email sending result
 * @public
 */
export interface BulkEmailResult {
  /** Whether all emails were processed */
  success: boolean;
  /** Total number of emails processed */
  total: number;
  /** Number of successfully sent emails */
  sent: number;
  /** Number of failed emails */
  failed: number;
  /** Array of individual email results */
  results: EmailResult[];
  /** Array of errors for failed emails */
  errors: Array<{ index: number; error: string }>;
}

/**
 * Email configuration validation result
 * @public
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Array of missing required fields */
  missing: string[];
  /** Array of validation errors */
  errors: string[];
}

/**
 * Email analytics data
 * @public
 */
export interface EmailAnalytics {
  /** Number of emails sent */
  sent: number;
  /** Number of emails delivered */
  delivered: number;
  /** Number of emails opened */
  opened: number;
  /** Number of emails clicked */
  clicked: number;
  /** Number of emails bounced */
  bounced: number;
  /** Number of emails marked as spam */
  spam: number;
  /** Delivery rate percentage */
  deliveryRate: number;
  /** Open rate percentage */
  openRate: number;
  /** Click rate percentage */
  clickRate: number;
}

/**
 * Email webhook event types
 * @public
 */
export type EmailWebhookEvent =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "spam"
  | "unsubscribed";

/**
 * Email webhook payload
 * @public
 */
export interface EmailWebhookPayload {
  /** Event type */
  event: EmailWebhookEvent;
  /** Message ID */
  messageId: string;
  /** Recipient email */
  email: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** Additional event data */
  data?: Record<string, unknown>;
}
