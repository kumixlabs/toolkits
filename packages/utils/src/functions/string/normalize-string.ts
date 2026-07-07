/**
 * Utility function for string normalization
 * Provides consistent string formatting by removing special characters and normalizing whitespace
 */

import { isDevelopment } from "../../constants/development";
import { logger } from "../logging/logger";

/**
 * Normalizes a string by removing special characters and normalizing whitespace
 * Useful for cleaning user input, keys, and other string data
 *
 * @param key - The string to normalize
 * @returns A normalized string with special characters removed and whitespace normalized
 *
 * @example
 * ```ts
 * import { normalizeString } from '@/utils/functions';
 *
 * // Remove special characters
 * normalizeString('Hello\u0000World')
 * // Returns "Hello World"
 *
 * // Normalize whitespace
 * normalizeString('Hello   World')
 * // Returns "hello world"
 *
 * // Handle empty input
 * normalizeString('')
 * // Returns ""
 *
 * // Normalize case
 * normalizeString('HeLLo WoRLd')
 * // Returns "hello world"
 *
 * // Remove BOM and other special characters
 * normalizeString('\uFEFFHello')
 * // Returns "hello"
 * ```
 */
export const normalizeString = (key: string): string => {
  if (!key) return "";

  const original = key;
  const normalized = key
    // Strip a leading UTF-8 BOM expressed either as the actual U+FEFF character
    // or as its raw byte sequence EF BB BF. (\u escapes only take 4 hex digits,
    // so the previous \uEFBBBF never matched the bytes.)
    .replace(/^\uFEFF/, "")
    .replace(/^\uFFFE/, "")
    .replace(/^[\u00EF\u00BB\u00BF]+/, "")
    // biome-ignore lint/suspicious/noControlCharactersInRegex: handle null-byte + BOM prefixes
    .replace(/^[\u0000\uFEFF]{2}/, "")
    // biome-ignore lint/suspicious/noControlCharactersInRegex: handle null-byte + noncharacter BOM prefixes
    .replace(/^[\uFFFE\u0000]{2}/, "")
    .replace(/^\u2028/, "")
    .replace(/^\u2029/, "")
    // Remove any non-printable characters using a function instead of regex with control characters
    .replace(/./g, (char) => {
      const code = char.charCodeAt(0);
      return code <= 0x1f || (code >= 0x7f && code <= 0x9f) ? "" : char;
    })
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim()
    // Optional: normalize case
    .toLowerCase();

  // Logging is gated behind an explicit env var (KUMIX_DEBUG_NORMALIZE) to avoid
  // accidentally dumping user input / secrets through the logger in dev.
  if (
    isDevelopment &&
    typeof process !== "undefined" &&
    process.env?.KUMIX_DEBUG_NORMALIZE &&
    original !== normalized
  ) {
    logger.log(
      `normalizeString: input changed (length ${original.length} -> ${normalized.length})`,
    );
  }

  return normalized;
};
