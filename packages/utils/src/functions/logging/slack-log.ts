/**
 * Utility functions for logging
 * Provides structured logging to Slack channels based on message type
 */

import { isDevelopment } from "../../constants/development";
import { SLACK_WEBHOOKS } from "../../constants/env";
import { logger } from "./logger";

/**
 * Mapping of log types to their corresponding Slack webhook environment variables
 * Each log type is sent to a different Slack channel
 */
const logTypeToEnv = {
  alerts: SLACK_WEBHOOKS.ALERTS,
  cron: SLACK_WEBHOOKS.CRON,
  links: SLACK_WEBHOOKS.LINKS,
  subscribers: SLACK_WEBHOOKS.SUBSCRIBERS,
  errors: SLACK_WEBHOOKS.ERRORS,
};

/**
 * Logs a message to Slack and/or console
 * Sends structured messages to different Slack channels based on message type
 *
 * @param options - Logging options
 * @param options.message - The message to log
 * @param options.type - The type of log determining which Slack channel to use
 * @param options.mention - Whether to mention a specific user in Slack (default: false)
 * @returns A Promise that resolves to the fetch response or undefined
 *
 * @example
 * ```ts
 * import { log } from '@/utils/functions';
 *
 * // Log an error
 * await log({
 *   message: "Database connection failed",
 *   type: "errors"
 * });
 *
 * // Log with a mention
 * await log({
 *   message: "Critical system failure",
 *   type: "alerts",
 *   mention: true
 * });
 *
 * // Log subscriber activity
 * await log({
 *   message: "New subscriber: user@example.com",
 *   type: "subscribers"
 * });
 *
 * // In development, logs to console instead of Slack
 * ```
 */
export const SlackLog = async ({
  message,
  type,
  mention = false,
  mentionUserId,
}: {
  message: string;
  type: "alerts" | "cron" | "links" | "subscribers" | "errors";
  /**
   * Mention a Slack user when `true`. Requires `mentionUserId` to be provided
   * (defaults to env `SLACK_MENTION_USER_ID`) — previously a hardcoded user ID
   * was baked into this published package.
   */
  mention?: boolean;
  /** Slack user ID (e.g. `U0404G6J3NJ`) to mention. Falls back to env. */
  mentionUserId?: string;
}) => {
  const HOOK = logTypeToEnv[type];

  // In development or when the relevant webhook is missing, log to console and bail
  if (isDevelopment || !HOOK) {
    logger.log(message);
    return;
  }

  const resolvedMentionId =
    mentionUserId ||
    (typeof process !== "undefined" ? process.env.SLACK_MENTION_USER_ID : undefined);

  try {
    return await fetch(HOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // prettier-ignore
              text: `${mention && resolvedMentionId ? `<@${resolvedMentionId}> ` : ""}${type === "alerts" || type === "errors" ? ":alert: " : ""}${message}`,
            },
          },
        ],
      }),
    });
  } catch (error) {
    logger.log(`Failed to log to Slack. Error: ${error}`);
  }
};
