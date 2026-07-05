/**
 * Runtime-agnostic environment variable reader
 * Provides safe environment variable access across Bun, Node, Deno, and Workers
 * without throwing when the host runtime does not expose `process` or `Deno`.
 */

/** Minimal Deno global shape we rely on (full Deno namespace is not in std types). */
declare const Deno: { env: { get(key: string): string | undefined } } | undefined;

/**
 * Reads an environment variable in a runtime-agnostic way.
 * Tries `process.env` first (Node/Bun), then falls back to `Deno.env`,
 * and finally to the provided fallback value. Failures are swallowed so
 * the function is safe to call in any JavaScript runtime, including
 * Workers where neither global is available.
 *
 * @param key - The name of the environment variable to read
 * @param fallback - Optional value to return when the variable is unset or empty
 * @returns The environment value, or `fallback` if unavailable
 *
 * @example
 * ```ts
 * import { getEnv } from '@kumix/utils';
 *
 * // Read with a fallback
 * const port = getEnv('PORT', '3000');
 * // Example output: '3000' if PORT is unset
 *
 * // Read optional config
 * const databaseUrl = getEnv('DATABASE_URL');
 * // Example output: 'postgres://...' or undefined
 *
 * // Use across runtimes (Node, Bun, Deno, Workers)
 * const apiKey = getEnv('API_KEY');
 * if (!apiKey) throw new Error('API_KEY is required');
 * ```
 */
export function getEnv(key: string, fallback?: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] || fallback;
    }
  } catch {
    // process.env doesn't exist in Workers
  }
  try {
    if (typeof Deno !== "undefined") {
      const env = Deno.env;
      if (env && typeof env.get === "function") {
        return env.get(key) || fallback;
      }
    }
  } catch {
    // Deno not available
  }
  return fallback;
}
