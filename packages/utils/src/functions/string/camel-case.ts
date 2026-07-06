/**
 * Utility function for string case conversion
 * Provides conversion from various cases (snake, kebab, space, Pascal) to camelCase
 */

/**
 * Converts a string to camelCase.
 * Handles snake_case, kebab-case, CONST_CASE, PascalCase, and space-separated words.
 *
 * @param str - The string to convert to camelCase
 * @returns The camelCase version of the input string
 *
 * @example
 * ```ts
 * toCamelCase('user_name')        // "userName"
 * toCamelCase('user-name')        // "userName"
 * toCamelCase('first name')       // "firstName"
 * toCamelCase('PascalCase')       // "pascalCase"
 * toCamelCase('first_name_last')  // "firstNameLastName"
 * ```
 */
export const toCamelCase = (str: string): string => {
  if (!str) return "";
  // Split on any non-alphanumeric boundary (underscore, dash, space) OR at the
  // transition between lowercase/digit and uppercase (PascalCase boundaries).
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const [first, ...rest] = words;
  return `${first.toLowerCase()}${rest
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("")}`;
};
