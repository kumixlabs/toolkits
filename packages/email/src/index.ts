/**
 * Kumix Email Package
 * Unified email service supporting multiple providers with React template rendering
 */

// =============================================================================
// FACTORY FUNCTIONS (Main API)
// =============================================================================

/**
 * Factory functions for creating email service instances
 */
export {
  createEmail,
  createNodemailer,
  createResend,
  getConfiguredProvider,
  isEmailConfigured,
} from "./factory";

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

/**
 * Core email service class and related functionality
 */
export { EmailService } from "./services";

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration loading and validation utilities
 */
export type { EnvRecord } from "./config";
export {
  getEmailEnvVars,
  hasEmailConfig,
  loadEmailConfig,
  loadNodemailerConfig,
  loadResendConfig,
  validateEmailEnvVars,
  validateNodemailerEnvVars,
  validateResendEnvVars,
} from "./config";

// =============================================================================
// PROVIDERS
// =============================================================================

export { NodemailerProvider } from "./providers/nodemailer";
/**
 * Email provider implementations
 */
export { ResendProvider } from "./providers/resend";

// =============================================================================
// TYPES
// =============================================================================

/**
 * TypeScript type definitions
 */
export type {
  BulkEmailOptions,
  BulkEmailResult,
  ConfigValidationResult,
  EmailAnalytics,
  EmailAttachment,
  EmailConfig,
  EmailProvider,
  EmailResult,
  EmailTemplateData,
  EmailTemplateOptions,
  EmailValidationResult,
  EmailWebhookEvent,
  EmailWebhookPayload,
  IEmailProvider,
  NodemailerConfig,
  ResendConfig,
  SendEmailOptions,
} from "./types";
