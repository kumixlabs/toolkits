/**
 * @fileoverview Email Helper Utilities
 *
 * This module provides utility functions for email operations including:
 * - Template rendering and text conversion
 * - Email address validation and formatting
 * - Content processing and sanitization
 * - Attachment handling
 * - Email list management
 *
 * Import from '@kumix/email/helpers' to access these utilities.
 *
 * @example
 * ```typescript
 * import {
 *   renderEmailTemplate,
 *   htmlToText,
 *   isValidEmail,
 *   formatEmailAddress,
 *   sanitizeHtml,
 *   generateUnsubscribeLink
 * } from '@kumix/email/helpers';
 * ```
 */

import React from "react";
import { render } from "react-email";

// =============================================================================
// TEMPLATE RENDERING
// =============================================================================

/**
 * Render React component to HTML string
 *
 * Converts a React email template component to HTML string that can be sent via email.
 *
 * @param Template - React component to render
 * @param props - Props to pass to the component
 * @returns Promise resolving to HTML string
 * @example
 * ```typescript
 * const WelcomeEmail = ({ name }: { name: string }) => <h1>Welcome {name}!</h1>;
 *
 * const html = await renderEmailTemplate(WelcomeEmail, { name: 'John' });
 * console.log(html); // "<h1>Welcome John!</h1>"
 * ```
 */
export async function renderEmailTemplate<T extends Record<string, unknown>>(
  Template: React.ComponentType<T>,
  props: T,
): Promise<string> {
  return render(React.createElement(Template, props));
}

/**
 * Generate plain text from HTML
 *
 * Converts HTML content to plain text by removing tags and normalizing whitespace.
 * Useful for creating text versions of HTML emails.
 *
 * @param html - HTML string to convert
 * @returns Plain text version of the HTML
 * @example
 * ```typescript
 * const html = '<h1>Hello</h1><p>Welcome to our <strong>platform</strong>!</p>';
 * const text = htmlToText(html);
 * console.log(text); // "Hello Welcome to our platform!"
 * ```
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
    .replace(/<\/p>/gi, "\n\n") // Convert </p> to double newlines
    .replace(/<\/h[1-6]>/gi, "\n\n") // Convert heading endings to double newlines
    .replace(/<[^>]*>/g, " ") // Remove all other HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n\s+/g, "\n") // Remove spaces after newlines
    .trim();
}

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

/**
 * Validate email address format
 *
 * Checks if an email address has a valid format using RFC 5322 compliant regex.
 *
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 * @example
 * ```typescript
 * console.log(isValidEmail('user@example.com')); // true
 * console.log(isValidEmail('invalid-email')); // false
 * console.log(isValidEmail('user+tag@example.co.uk')); // true
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple email addresses
 *
 * Validates an array of email addresses or a single email address.
 *
 * @param emails - Single email or array of emails to validate
 * @returns true if all emails are valid, false if any are invalid
 * @example
 * ```typescript
 * console.log(validateEmails('user@example.com')); // true
 * console.log(validateEmails(['user1@example.com', 'user2@example.com'])); // true
 * console.log(validateEmails(['valid@example.com', 'invalid-email'])); // false
 * ```
 */
export function validateEmails(emails: string | string[]): boolean {
  const emailArray = Array.isArray(emails) ? emails : [emails];
  return emailArray.every((email) => isValidEmail(email.trim()));
}

/**
 * Filter valid emails from a list
 *
 * Returns only the valid email addresses from a list, filtering out invalid ones.
 *
 * @param emails - Array of email addresses to filter
 * @returns Array containing only valid email addresses
 * @example
 * ```typescript
 * const emails = ['valid@example.com', 'invalid-email', 'another@example.com'];
 * const validEmails = filterValidEmails(emails);
 * console.log(validEmails); // ['valid@example.com', 'another@example.com']
 * ```
 */
export function filterValidEmails(emails: string[]): string[] {
  return emails.filter((email) => isValidEmail(email.trim()));
}

// =============================================================================
// EMAIL FORMATTING
// =============================================================================

/**
 * Format email address with display name
 *
 * Combines a display name with an email address in the standard format.
 *
 * @param name - Display name for the email address
 * @param email - Email address
 * @returns Formatted email address string
 * @example
 * ```typescript
 * const formatted = formatEmailAddress('John Doe', 'john@example.com');
 * console.log(formatted); // "John Doe <john@example.com>"
 * ```
 */
export function formatEmailAddress(name: string, email: string): string {
  // Don't escape quotes - keep them as is for standard email format
  return `${name} <${email}>`;
}

/**
 * Extract email address from formatted string
 *
 * Extracts the email address from a formatted "Name <email>" string.
 *
 * @param formattedAddress - Formatted email address string
 * @returns Just the email address part
 * @example
 * ```typescript
 * const email = extractEmail('John Doe <john@example.com>');
 * console.log(email); // "john@example.com"
 *
 * const email2 = extractEmail('simple@example.com');
 * console.log(email2); // "simple@example.com"
 * ```
 */
export function extractEmail(formattedAddress: string): string {
  const match = formattedAddress.match(/<([^>]*)>/);
  return match ? match[1] : formattedAddress.trim();
}

/**
 * Extract display name from formatted email address
 *
 * Extracts the display name from a formatted "Name <email>" string.
 *
 * @param formattedAddress - Formatted email address string
 * @returns Display name or empty string if none found
 * @example
 * ```typescript
 * const name = extractDisplayName('John Doe <john@example.com>');
 * console.log(name); // "John Doe"
 *
 * const name2 = extractDisplayName('simple@example.com');
 * console.log(name2); // ""
 * ```
 */
export function extractDisplayName(formattedAddress: string): string {
  const match = formattedAddress.match(/^(.+?)\s*<[^>]*>$/);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

// =============================================================================
// CONTENT PROCESSING
// =============================================================================

/**
 * Sanitize HTML content for email
 *
 * Removes potentially dangerous HTML elements and attributes while preserving
 * email-safe formatting.
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML safe for email
 * @example
 * ```typescript
 * const unsafeHtml = '<script>alert("xss")</script><p>Safe content</p>';
 * const safeHtml = sanitizeHtml(unsafeHtml);
 * console.log(safeHtml); // "<p>Safe content</p>"
 * ```
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ""); // onclick, onload, etc.
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, ""); // javascript: urls

  // Remove style attributes that could be dangerous
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*expression\([^"']*\)["']/gi, "");

  return sanitized;
}

/**
 * Truncate text with ellipsis
 *
 * Truncates text to a specified length and adds ellipsis if needed.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param ellipsis - String to append when truncated (default: '...')
 * @returns Truncated text
 * @example
 * ```typescript
 * const text = 'This is a very long email subject line';
 * const truncated = truncateText(text, 20);
 * console.log(truncated); // "This is a very long..."
 * ```
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = "..."): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Generate email preview text
 *
 * Creates a preview text from HTML content, suitable for email preview panes.
 *
 * @param html - HTML content to generate preview from
 * @param maxLength - Maximum length of preview text (default: 150)
 * @returns Preview text
 * @example
 * ```typescript
 * const html = '<h1>Welcome!</h1><p>Thank you for joining our platform.</p>';
 * const preview = generatePreviewText(html);
 * console.log(preview); // "Welcome! Thank you for joining our platform."
 * ```
 */
export function generatePreviewText(html: string, maxLength: number = 150): string {
  const text = htmlToText(html);
  return truncateText(text, maxLength);
}

// =============================================================================
// URL AND LINK UTILITIES
// =============================================================================

/**
 * Generate unsubscribe link
 *
 * Creates an unsubscribe URL with proper parameters.
 *
 * @param baseUrl - Base URL for unsubscribe endpoint
 * @param email - Email address to unsubscribe
 * @param token - Optional security token
 * @returns Complete unsubscribe URL
 * @example
 * ```typescript
 * const link = generateUnsubscribeLink(
 *   'https://example.com/unsubscribe',
 *   'user@example.com',
 *   'secure-token-123'
 * );
 * console.log(link); // "https://example.com/unsubscribe?email=user%40example.com&token=secure-token-123"
 * ```
 */
export function generateUnsubscribeLink(baseUrl: string, email: string, token?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("email", email);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

/**
 * Generate tracking pixel URL
 *
 * Creates a tracking pixel URL for email open tracking.
 *
 * @param baseUrl - Base URL for tracking endpoint
 * @param emailId - Unique identifier for the email
 * @param recipientId - Unique identifier for the recipient
 * @returns Tracking pixel URL
 * @example
 * ```typescript
 * const pixelUrl = generateTrackingPixel(
 *   'https://example.com/track',
 *   'email-123',
 *   'user-456'
 * );
 * // Use in email: <img src="${pixelUrl}" width="1" height="1" />
 * ```
 */
export function generateTrackingPixel(
  baseUrl: string,
  emailId: string,
  recipientId: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("email_id", emailId);
  url.searchParams.set("recipient_id", recipientId);
  url.searchParams.set("t", Date.now().toString());
  return url.toString();
}

/**
 * Add UTM parameters to URL
 *
 * Adds UTM tracking parameters to a URL for campaign tracking.
 *
 * @param url - Original URL
 * @param utmParams - UTM parameters object
 * @returns URL with UTM parameters added
 * @example
 * ```typescript
 * const trackedUrl = addUtmParams('https://example.com/product', {
 *   source: 'email',
 *   medium: 'newsletter',
 *   campaign: 'summer_sale',
 *   content: 'header_button'
 * });
 * ```
 */
export function addUtmParams(
  url: string,
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  },
): string {
  const urlObj = new URL(url);

  if (utmParams.source) urlObj.searchParams.set("utm_source", utmParams.source);
  if (utmParams.medium) urlObj.searchParams.set("utm_medium", utmParams.medium);
  if (utmParams.campaign) urlObj.searchParams.set("utm_campaign", utmParams.campaign);
  if (utmParams.term) urlObj.searchParams.set("utm_term", utmParams.term);
  if (utmParams.content) urlObj.searchParams.set("utm_content", utmParams.content);

  return urlObj.toString();
}

// =============================================================================
// EMAIL LIST UTILITIES
// =============================================================================

/**
 * Parse email list from string
 *
 * Parses a comma or semicolon separated string of email addresses.
 *
 * @param emailString - String containing multiple email addresses
 * @returns Array of trimmed email addresses
 * @example
 * ```typescript
 * const emails = parseEmailList('user1@example.com, user2@example.com; user3@example.com');
 * console.log(emails); // ['user1@example.com', 'user2@example.com', 'user3@example.com']
 * ```
 */
export function parseEmailList(emailString: string): string[] {
  return emailString
    .split(/[,;]/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Deduplicate email list
 *
 * Removes duplicate email addresses from a list (case-insensitive).
 *
 * @param emails - Array of email addresses
 * @returns Array with duplicates removed
 * @example
 * ```typescript
 * const emails = ['user@example.com', 'USER@EXAMPLE.COM', 'other@example.com'];
 * const unique = deduplicateEmails(emails);
 * console.log(unique); // ['user@example.com', 'other@example.com']
 * ```
 */
export function deduplicateEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  return emails.filter((email) => {
    const normalized = email.toLowerCase().trim();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * Chunk email list for batch sending
 *
 * Splits a large email list into smaller chunks for batch processing.
 *
 * @param emails - Array of email addresses
 * @param chunkSize - Size of each chunk (default: 100)
 * @returns Array of email chunks
 * @example
 * ```typescript
 * const emails = ['user1@example.com', 'user2@example.com', ...]; // 250 emails
 * const chunks = chunkEmails(emails, 100);
 * console.log(chunks.length); // 3 chunks
 * console.log(chunks[0].length); // 100
 * console.log(chunks[2].length); // 50
 * ```
 */
export function chunkEmails(emails: string[], chunkSize: number = 100): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < emails.length; i += chunkSize) {
    chunks.push(emails.slice(i, i + chunkSize));
  }
  return chunks;
}

// =============================================================================
// ATTACHMENT UTILITIES
// =============================================================================

/**
 * Get MIME type from file extension
 *
 * Returns the appropriate MIME type for common file extensions.
 *
 * @param filename - Filename or extension
 * @returns MIME type string
 * @example
 * ```typescript
 * console.log(getMimeType('document.pdf')); // 'application/pdf'
 * console.log(getMimeType('image.jpg')); // 'image/jpeg'
 * console.log(getMimeType('.png')); // 'image/png'
 * ```
 */
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() || "";

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    xml: "application/xml",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Format file size for display
 *
 * Converts file size in bytes to human-readable format.
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 * @example
 * ```typescript
 * console.log(formatFileSize(1024)); // "1.00 KB"
 * console.log(formatFileSize(1048576)); // "1.00 MB"
 * console.log(formatFileSize(1073741824, 1)); // "1.0 GB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(dm)} ${sizes[i]}`;
}
