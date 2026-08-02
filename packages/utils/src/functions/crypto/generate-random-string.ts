/**
 * Utility function for generating cryptographically secure random strings
 * Provides secure random string generation for tokens, IDs, and other security-sensitive uses
 */

export function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  const randomBytes = new Uint32Array(length);
  globalThis.crypto.getRandomValues(randomBytes);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    result += charset[randomIndex];
  }

  return result;
}
