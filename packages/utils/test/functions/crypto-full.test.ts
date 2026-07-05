import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRandomString } from "../../src/functions/crypto/generate-random-string";
import { hashStringSHA256 } from "../../src/functions/crypto/hash-string";
import {
  decodeJWT,
  generateJWT,
  getJWTTimeRemaining,
  isJWTExpired,
  verifyJWT,
} from "../../src/functions/crypto/jwt";
import {
  generateSecurePassword,
  hashPassword,
  needsRehash,
  verifyPassword,
} from "../../src/functions/crypto/password";
import { baseId, baseIdCustom } from "../../src/functions/crypto/base-id";

vi.mock("jsonwebtoken", async (orig) => await orig());
vi.mock("bcryptjs", async (orig) => await orig());

const SECRET = "super-secret-key-for-testing";

describe("generateRandomString", () => {
  it("generates a string of the requested length using charset", () => {
    const s = generateRandomString(16);
    expect(s).toHaveLength(16);
    expect(/^[A-Z0-9]+$/.test(s)).toBe(true);
  });

  it("returns empty string for length 0", () => {
    expect(generateRandomString(0)).toBe("");
  });
});

describe("hashStringSHA256", () => {
  it("hashes a string to a known SHA-256 hex digest", async () => {
    const hash = await hashStringSHA256("hello world");
    expect(hash).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    );
    expect(hash).toHaveLength(64);
  });

  it("produces different digests for different inputs", async () => {
    const a = await hashStringSHA256("a");
    const b = await hashStringSHA256("b");
    expect(a).not.toBe(b);
  });
});

describe("generateJWT", () => {
  it("generates a signed token for a valid payload", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET);
    expect(typeof token).toBe("string");
    expect((token as string).split(".")).toHaveLength(3);
  });

  it("respects issuer and audience options", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      issuer: "app.com",
      audience: "aud",
      expiresIn: "1h",
    });
    const result = verifyJWT(token as string, SECRET, {
      issuer: "app.com",
      audience: "aud",
    });
    expect(result.isValid).toBe(true);
  });

  it("generates a decodable token carrying the payload", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = generateJWT({ userId: "1", email: "u@x.com", exp }, SECRET);
    const decoded = decodeJWT(token as string);
    expect(decoded?.userId).toBe("1");
    expect(decoded?.email).toBe("u@x.com");
  });

  it("returns null when payload is not an object", () => {
    expect(generateJWT(null as never, SECRET)).toBeNull();
  });

  it("returns null when userId is missing", () => {
    expect(generateJWT({ email: "u@x.com" } as never, SECRET)).toBeNull();
  });

  it("returns null when email is missing", () => {
    expect(generateJWT({ userId: "1" } as never, SECRET)).toBeNull();
  });

  it("returns null when secret is empty", () => {
    expect(generateJWT({ userId: "1", email: "u@x.com" }, "")).toBeNull();
  });

  it("returns null when signing throws (circular payload)", () => {
    const payload: Record<string, unknown> = { userId: "1", email: "u@x.com" };
    payload.self = payload;
    expect(generateJWT(payload as never, SECRET)).toBeNull();
  });
});

describe("verifyJWT", () => {
  it("returns error when token is not a string", () => {
    const result = verifyJWT("", SECRET);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Token");
  });

  it("returns error when secret is not a string", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET);
    const result = verifyJWT(token as string, "");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Secret");
  });

  it("reports expired tokens", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      expiresIn: "-1s",
    });
    const result = verifyJWT(token as string, SECRET);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Token has expired");
  });

  it("reports invalid token format", () => {
    const result = verifyJWT("not-a-jwt", SECRET);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid token format");
  });

  it("reports invalid signature as JsonWebTokenError", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET);
    const result = verifyJWT(token as string, "wrong-secret");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid token format");
  });
});

describe("decodeJWT", () => {
  it("decodes without verification", () => {
    const token = generateJWT({ userId: "42", email: "u@x.com" }, SECRET);
    const decoded = decodeJWT(token as string);
    expect(decoded?.userId).toBe("42");
  });

  it("returns null for non-string token", () => {
    expect(decodeJWT("" as string)).toBeNull();
  });

  it("returns null for malformed token", () => {
    expect(decodeJWT("garbage")).toBeNull();
  });
});

describe("isJWTExpired", () => {
  it("returns false for a fresh token", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      expiresIn: "1h",
    });
    expect(isJWTExpired(token as string)).toBe(false);
  });

  it("returns true when there is no exp", () => {
    expect(isJWTExpired("garbage")).toBe(true);
  });

  it("returns true for an expired token", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      expiresIn: "-1s",
    });
    expect(isJWTExpired(token as string)).toBe(true);
  });
});

describe("getJWTTimeRemaining", () => {
  it("returns remaining seconds for a valid token", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      expiresIn: "1h",
    });
    const remaining = getJWTTimeRemaining(token as string);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(3600);
  });

  it("returns 0 when no exp present", () => {
    expect(getJWTTimeRemaining("garbage")).toBe(0);
  });

  it("returns 0 for expired token", () => {
    const token = generateJWT({ userId: "1", email: "u@x.com" }, SECRET, {
      expiresIn: "-10s",
    });
    expect(getJWTTimeRemaining(token as string)).toBe(0);
  });
});

describe("hashPassword", () => {
  it("hashes a valid password", async () => {
    const hash = await hashPassword("secret123");
    expect(typeof hash).toBe("string");
    expect(hash?.startsWith("$2")).toBe(true);
  });

  it("returns null for empty or non-string password", async () => {
    expect(await hashPassword("")).toBeNull();
    expect(await hashPassword(null as never)).toBeNull();
  });

  it("returns null for out-of-range salt rounds", async () => {
    expect(await hashPassword("secret123", { saltRounds: 2 })).toBeNull();
    expect(await hashPassword("secret123", { saltRounds: 50 })).toBeNull();
  });

  it("respects custom salt rounds", async () => {
    const hash = await hashPassword("secret123", { saltRounds: 6 });
    expect(hash?.startsWith("$2")).toBe(true);
  });
});

describe("verifyPassword", () => {
  it("verifies a correct password", async () => {
    const hash = (await hashPassword("secret123", { saltRounds: 6 })) as string;
    const result = await verifyPassword("secret123", hash);
    expect(result.isValid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = (await hashPassword("secret123", { saltRounds: 6 })) as string;
    const result = await verifyPassword("wrong", hash);
    expect(result.isValid).toBe(false);
  });

  it("errors on invalid password input", async () => {
    const result = await verifyPassword("", "$2a$10$abc");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Password");
  });

  it("errors on invalid hash input", async () => {
    const result = await verifyPassword("secret", "" as string);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Hashed");
  });

  it("errors on wrong hash format", async () => {
    const result = await verifyPassword("secret", "plain-not-bcrypt");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid hash format");
  });
});

describe("needsRehash", () => {
  it("returns true for invalid hash", () => {
    expect(needsRehash("" as string)).toBe(true);
    expect(needsRehash("bad")).toBe(true);
  });

  it("detects mismatched salt rounds", () => {
    expect(needsRehash("$2a$10$abcdefghijklmnopqrstuv", 12)).toBe(true);
  });

  it("returns false when salt rounds match", () => {
    expect(needsRehash("$2a$12$abcdefghijklmnopqrstuv", 12)).toBe(false);
  });
});

describe("generateSecurePassword", () => {
  it("generates default length", () => {
    expect(generateSecurePassword()).toHaveLength(16);
  });

  it("clamps length to bounds", () => {
    expect(generateSecurePassword(2)).toHaveLength(8);
    expect(generateSecurePassword(200)).toHaveLength(128);
  });

  it("uses only requested character sets", () => {
    const pwd = generateSecurePassword(20, {
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(/^[a-z]+$/.test(pwd)).toBe(true);
  });

  it("falls back to alphanumeric when nothing selected", () => {
    const pwd = generateSecurePassword(20, {
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(/^[A-Za-z0-9]+$/.test(pwd)).toBe(true);
  });
});

describe("base-id", () => {
  it("baseIdCustom prefixes the id", () => {
    const id = baseIdCustom({ prefix: "inv_" });
    expect(id.startsWith("inv_")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });

  it("baseId works with known prefixes", () => {
    const id = baseId({ prefix: "user_" });
    expect(id.startsWith("user_")).toBe(true);
  });

  it("generates unique ids", () => {
    const a = baseIdCustom({ prefix: "x_" });
    const b = baseIdCustom({ prefix: "x_" });
    expect(a).not.toBe(b);
  });
});
