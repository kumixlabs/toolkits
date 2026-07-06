/**
 * URL validation utilities
 * Provides functions for validating URL strings and checking URL validity
 */

/**
 * Checks if a string is a valid URL.
 *
 * By default rejects non-fetchable schemes (`javascript:`, `data:`, `file:`,
 * `vbscript:`) to avoid XSS via redirect/href validation. Set `allowAnyScheme`
 * to accept any scheme the URL parser accepts.
 *
 * Uses the URL constructor for validation.
 *
 * @param url - The string to check
 * @param options - Validation options
 * @param options.allowAnyScheme - When true, accept any scheme (defaults to false)
 * @returns True if the string is a valid URL, false otherwise
 *
 * @example
 * ```typescript
 * import { isValidUrl } from '@kumix/utils';
 *
 * // Valid URLs
 * isValidUrl('https://example.com'); // true
 * isValidUrl('http://localhost:3000'); // true
 * isValidUrl('ftp://files.example.com'); // true
 *
 * // Invalid / unsafe URLs (rejected by default)
 * isValidUrl('javascript:alert(1)'); // false
 * isValidUrl('example.com'); // false (missing protocol)
 *
 * // Use in form validation
 * function validateUrlInput(input: string) {
 *   if (!isValidUrl(input)) {
 *     return 'Please enter a valid URL';
 *   }
 *   return null;
 * }
 * ```
 */
export const isValidUrl = (url: string, options: { allowAnyScheme?: boolean } = {}): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (options.allowAnyScheme) return true;
    // Block schemes that are unsafe when fed back into href/redirect targets.
    const blocked = ["javascript:", "data:", "vbscript:", "file:"];
    const scheme = parsed.protocol.toLowerCase();
    if (blocked.some((b) => scheme === b)) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
};
