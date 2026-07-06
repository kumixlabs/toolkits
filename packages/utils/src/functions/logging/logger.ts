/**
 * Centralized logging utility for the application
 * Provides consistent logging interface using Consola with custom formatting
 * Used throughout the application to replace console.log statements
 */

import { createConsola } from "consola";

import { isDevelopment, LOG_LEVEL } from "../../constants/development";

/**
 * Application logger instance with consistent formatting
 *
 * Provides structured logging with different levels (info, warn, error, debug)
 * and consistent formatting across the application. Replaces direct console usage.
 *
 * @example
 * ```typescript
 * import { logger } from '@kumix/utils';
 *
 * // Basic logging
 * logger.info('User logged in successfully');
 * logger.warn('API rate limit approaching');
 * logger.error('Database connection failed');
 * logger.debug('Processing user data', { userId: 123 });
 *
 * // With context data
 * logger.info('User action completed', {
 *   userId: user.id,
 *   action: 'profile_update',
 *   timestamp: new Date().toISOString()
 * });
 *
 * // Error logging with stack trace
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logger.error('Operation failed', { error, context: 'user-service' });
 * }
 *
 * // Performance logging
 * const startTime = Date.now();
 * await someOperation();
 * logger.debug('Operation completed', {
 *   duration: Date.now() - startTime,
 *   operation: 'data-processing'
 * });
 * ```
 */
// Parse the configured log level safely. Non-numeric values would previously
// fall through as `NaN`, leaving the logger at an indeterminate level.
const parsedLevel = LOG_LEVEL !== undefined ? Number(LOG_LEVEL) : Number.NaN;
const resolvedLevel = isDevelopment ? 5 : Number.isFinite(parsedLevel) ? parsedLevel : 3;

export const logger = createConsola({
  level: resolvedLevel,
  formatOptions: {
    date: false,
  },
});
