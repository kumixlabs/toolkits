/**
 * Password hashing and verification utilities for SaaS applications
 * Provides secure password handling using bcrypt with proper salt rounds
 * Includes validation and error handling for production use
 */

import bcrypt from "bcryptjs";

import { logger } from "../logging/logger";

/**
 * Default salt rounds for bcrypt hashing
 * 12 rounds provides good security while maintaining reasonable performance
 * Higher values increase security but also increase computation time
 */
const DEFAULT_SALT_ROUNDS = 12;

/**
 * Interface for password hashing options
 */
interface HashPasswordOptions {
  /** Number of salt rounds for bcrypt (default: 12) */
  saltRounds?: number;
}

/**
 * Interface for password verification result
 */
interface VerifyPasswordResult {
  /** Whether the password is valid */
  isValid: boolean;
  /** Error message if verification failed */
  error?: string;
}

/**
 * Hashes a password using bcrypt with salt
 *
 * @param password - The plain text password to hash
 * @param options - Hashing options
 * @returns Promise that resolves to the hashed password
 * @throws Error on invalid input (empty password, salt rounds outside 4–20,
 *   or password longer than bcrypt's 72-byte limit) or on internal failure.
 *   Invalid input is a caller bug — throw instead of returning null so it
 *   surfaces immediately rather than propagating `null` into storage.
 *
 * @example
 * ```typescript
 * import { hashPassword } from '@kumix/utils/server';
 *
 * // Basic usage
 * const hashedPassword = await hashPassword('userPassword123');
 * await saveUser({ email, password: hashedPassword });
 *
 * // With custom salt rounds
 * const hashedPassword = await hashPassword('userPassword123', {
 *   saltRounds: 14
 * });
 * ```
 */
export async function hashPassword(
  password: string,
  options: HashPasswordOptions = {},
): Promise<string> {
  // Validate input
  if (!password || typeof password !== "string" || password.length < 1) {
    throw new Error("Password must be a non-empty string");
  }

  const { saltRounds = DEFAULT_SALT_ROUNDS } = options;

  // Validate salt rounds
  if (typeof saltRounds !== "number" || saltRounds < 4 || saltRounds > 20) {
    throw new Error("Salt rounds must be between 4 and 20");
  }

  // bcrypt silently truncates inputs longer than 72 bytes, which makes
  // distinct long passwords collide. Reject oversize inputs explicitly so
  // callers learn about the limit instead of getting a false sense of
  // uniqueness. (Pre-hashing e.g. SHA-256 would also work, but changes the
  // hash format and is left as a caller concern.)
  if (new TextEncoder().encode(password).length > 72) {
    throw new Error("Password exceeds bcrypt's 72-byte limit");
  }

  // Generate salt and hash password. bcrypt failures propagate as
  // exceptions instead of being swallowed into `null`.
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a password against its hash
 *
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise that resolves to verification result
 *
 * @example
 * ```typescript
 * import { verifyPassword } from '@kumix/utils';
 *
 * // Basic usage
 * const result = await verifyPassword('userPassword123', storedHashedPassword);
 * if (result.isValid) {
 *   // Password is correct, proceed with login
 *   await loginUser(user);
 * } else {
 *   // Password is incorrect
 *   throw new Error('Invalid credentials');
 * }
 *
 * // With error handling
 * const result = await verifyPassword('userPassword123', storedHashedPassword);
 * if (result.error) {
 *   logger.error('Password verification failed:', result.error);
 *   throw new Error('Authentication error');
 * }
 *
 * // In authentication middleware
 * async function authenticateUser(email: string, password: string) {
 *   const user = await getUserByEmail(email);
 *   if (!user) {
 *     return { success: false, error: 'User not found' };
 *   }
 *
 *   const result = await verifyPassword(password, user.hashedPassword);
 *   if (!result.isValid) {
 *     return { success: false, error: 'Invalid password' };
 *   }
 *
 *   return { success: true, user };
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<VerifyPasswordResult> {
  // Validate inputs
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      error: "Password must be a non-empty string",
    };
  }

  if (!hashedPassword || typeof hashedPassword !== "string") {
    return {
      isValid: false,
      error: "Hashed password must be a non-empty string",
    };
  }

  // Basic bcrypt hash format validation
  if (
    !hashedPassword.startsWith("$2a$") &&
    !hashedPassword.startsWith("$2b$") &&
    !hashedPassword.startsWith("$2y$")
  ) {
    return {
      isValid: false,
      error: "Invalid hash format",
    };
  }

  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return { isValid };
  } catch (error) {
    logger.error("Password verification: Failed to verify password", { error });
    return {
      isValid: false,
      error: "Password verification failed",
    };
  }
}

/**
 * Checks if a password needs to be rehashed (e.g., due to updated salt rounds)
 *
 * @param hashedPassword - The current hashed password
 * @param targetSaltRounds - The target salt rounds (default: 12)
 * @returns Whether the password needs to be rehashed
 *
 * @example
 * ```typescript
 * import { needsRehash, hashPassword } from '@kumix/utils';
 *
 * // Check if password needs rehashing during login
 * async function loginUser(email: string, password: string) {
 *   const user = await getUserByEmail(email);
 *   const result = await verifyPassword(password, user.hashedPassword);
 *
 *   if (result.isValid) {
 *     // Check if we need to rehash with updated salt rounds
 *     if (needsRehash(user.hashedPassword, 14)) {
 *       const newHash = await hashPassword(password, { saltRounds: 14 });
 *       if (newHash) {
 *         await updateUserPassword(user.id, newHash);
 *       }
 *     }
 *
 *     return { success: true, user };
 *   }
 *
 *   return { success: false, error: 'Invalid credentials' };
 * }
 * ```
 */
export function needsRehash(
  hashedPassword: string,
  targetSaltRounds: number = DEFAULT_SALT_ROUNDS,
): boolean {
  if (!hashedPassword || typeof hashedPassword !== "string") {
    return true; // Invalid hash should be rehashed
  }

  try {
    // Extract salt rounds from hash
    const parts = hashedPassword.split("$");
    if (parts.length < 4) {
      return true; // Invalid format
    }

    const currentSaltRounds = parseInt(parts[2], 10);
    return currentSaltRounds !== targetSaltRounds;
  } catch (error) {
    logger.warn("Password rehash check: Failed to parse hash", { error });
    return true; // If we can't parse, assume it needs rehashing
  }
}

/**
 * Generates a secure random password
 *
 * @param length - Length of the password (default: 16, min: 8, max: 128)
 * @param options - Password generation options
 * @returns Generated password string
 *
 * @example
 * ```typescript
 * import { generateSecurePassword } from '@kumix/utils';
 *
 * // Generate default password (16 characters)
 * const password = generateSecurePassword();
 *
 * // Generate longer password
 * const longPassword = generateSecurePassword(24);
 *
 * // Generate password without symbols
 * const simplePassword = generateSecurePassword(12, {
 *   includeSymbols: false
 * });
 *
 * // For temporary passwords
 * const tempPassword = generateSecurePassword(12);
 * await sendPasswordResetEmail(user.email, tempPassword);
 * ```
 */
export function generateSecurePassword(
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {},
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  // Validate length
  const validLength = Math.max(8, Math.min(128, length));

  let charset = "";
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (includeNumbers) charset += "0123456789";
  if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (charset.length === 0) {
    // Fallback to alphanumeric if no character sets selected
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  }

  // Rejection sampling: `2**32 % charset.length` is nonzero for most
  // charsets, so naive `% charset.length` skews toward lower indices.
  // Discard values at/above the largest multiple of charset.length instead.
  const limit = Math.floor(2 ** 32 / charset.length) * charset.length;
  const pool = new Uint32Array(validLength);
  let index = 0;
  let password = "";
  while (password.length < validLength) {
    if (index >= pool.length) {
      globalThis.crypto.getRandomValues(pool);
      index = 0;
    }
    const value = pool[index++];
    if (value < limit) password += charset[value % charset.length];
  }

  return password;
}
