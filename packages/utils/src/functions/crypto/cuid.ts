/**
 * CUID (Collision-resistant Unique IDentifier) generation utilities
 * Provides functions for generating unique identifiers using @paralleldrive/cuid2
 */

import { createId, init } from "@paralleldrive/cuid2";

export { createId, init as initCuid };

// Cache generators per length so we keep cuid2's internal fingerprint+counter
// state across calls instead of recreating it on every invocation (which would
// defeat cuid2's collision-resistance between rapid successive calls).
const generatorCache = new Map<number, (prefix?: string) => string>();

function getGenerator(length: number): (prefix?: string) => string {
  let generator = generatorCache.get(length);
  if (!generator) {
    // NOTE: do NOT override `random` — cuid2 defaults to a cryptographically
    // secure RNG. Replacing it with Math.random makes IDs predictable.
    generator = init({ length });
    generatorCache.set(length, generator);
  }
  return generator;
}

/**
 * Generates a CUID (Collision-resistant Unique IDentifier)
 * CUIDs are designed to be globally unique, even in distributed systems.
 * They are based on the current time, a random component, and a counter.
 * Perfect for database IDs, session tokens, and any scenario requiring unique identifiers.
 *
 * @returns A CUID string
 *
 * @example
 * ```ts
 * import { cuid } from '@/utils/functions';
 *
 * // Generate a CUID
 * const id = cuid();
 * // Returns: 'clhqxr8kj0000qzrmn5t8b123'
 *
 * // Use as unique identifiers
 * const userId = cuid();
 * const sessionId = cuid();
 * const transactionId = cuid();
 *
 * // Use in database models
 * const user = {
 *   id: cuid(),
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * };
 *
 * // Use for temporary files
 * const tempFileName = `temp_${cuid()}.json`;
 * ```
 */
export function cuid() {
  return createId();
}

/**
 * Generates a custom ID with an optional prefix and configurable length.
 * Uses `@paralleldrive/cuid2`'s cryptographically-secure RNG.
 *
 * @param prefix - Optional prefix to prepend to the ID
 * @param length - The length of the generated ID (default is 12)
 * @returns A unique custom ID string
 *
 * @example
 * ```ts
 * import { customId } from '@/utils/functions';
 *
 * // Generate ID with prefix
 * const userId = customId('user_');
 * // Returns: 'user_l5r8xn2gzqnb'
 *
 * // Generate ID with custom length
 * const orderId = customId('order_', 16);
 * ```
 */
export function customId(prefix?: string, length: number = 12) {
  const generateId = getGenerator(length);
  return `${prefix || ""}${generateId()}`;
}

/**
 * @deprecated Use {@link customId} instead. This alias has a typo and is kept
 * only for backward compatibility; it will be removed in a future major.
 */
export const customeId = customId;
