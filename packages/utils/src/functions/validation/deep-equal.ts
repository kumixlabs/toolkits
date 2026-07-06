/**
 * Utility function for deep object comparison
 * Provides recursive comparison of nested objects and arrays
 */

/**
 * Type definition for the deepEqual function
 * Specifies the function signature for comparing two objects deeply
 */
type DeepEqual = (obj1: Record<string, unknown>, obj2: Record<string, unknown>) => boolean;

/**
 * Performs a deep equality check between two objects
 * Recursively compares all nested properties and values
 *
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns True if objects are deeply equal, false otherwise
 *
 * @example
 * ```ts
 * import { deepEqual } from '@/utils/functions';
 *
 * // Simple objects
 * deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })
 * // Returns true
 *
 * // Different order of keys doesn't matter
 * deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })
 * // Returns true
 *
 * // Nested objects
 * deepEqual(
 *   { a: 1, b: { c: 3, d: 4 } },
 *   { a: 1, b: { c: 3, d: 4 } }
 * )
 * // Returns true
 *
 * // Different values
 * deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })
 * // Returns false
 *
 * // Different structure
 * deepEqual({ a: 1, b: 2 }, { a: 1, c: 2 })
 * // Returns false
 *
 * // Different nesting
 * deepEqual(
 *   { a: 1, b: { c: 3 } },
 *   { a: 1, b: { c: 4 } }
 * )
 * // Returns false
 * ```
 */
export const deepEqual: DeepEqual = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true;
  }

  if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
    return false;
  }

  // Compare by type tag to distinguish Date, RegExp, Map, Set, Array, etc.
  const tag1 = Object.prototype.toString.call(obj1);
  const tag2 = Object.prototype.toString.call(obj2);
  if (tag1 !== tag2) {
    return false;
  }

  // Handle Date — compare by time value
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // Handle RegExp — compare source and flags
  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.source === obj2.source && obj1.flags === obj2.flags;
  }

  // Handle arrays — compare length first, then elements in order
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i] as Record<string, unknown>, obj2[i] as Record<string, unknown>)) {
        return false;
      }
    }
    return true;
  }

  // Handle Map — compare size, then every key/value pair (order-sensitive, like array)
  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    for (const [key, value] of obj1) {
      if (!obj2.has(key)) {
        return false;
      }
      if (!deepEqual(value as Record<string, unknown>, obj2.get(key) as Record<string, unknown>)) {
        return false;
      }
    }
    return true;
  }

  // Handle Set — compare size, then every element (deepEqual to support object members)
  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    for (const value of obj1) {
      // Sets don't have deep lookup, so check each candidate of obj2.
      let found = false;
      for (const other of obj2) {
        if (deepEqual(value as Record<string, unknown>, other as Record<string, unknown>)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }

    const val1 = obj1[key];
    const val2 = obj2[key];

    // If both values are objects, recursively compare them
    if (typeof val1 === "object" && val1 !== null && typeof val2 === "object" && val2 !== null) {
      if (!deepEqual(val1 as Record<string, unknown>, val2 as Record<string, unknown>)) {
        return false;
      }
    } else if (val1 !== val2) {
      // For non-object values, use strict equality
      return false;
    }
  }

  return true;
};
