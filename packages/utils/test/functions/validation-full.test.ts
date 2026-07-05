import { describe, expect, it } from "vitest";
import {
  getEmailDomain,
  isBusinessEmail,
  isDisposableEmail,
  normalizeEmail,
  validateEmail,
} from "../../src/functions/validation/email";
import {
  isReservedKeyGlobal,
  isUnsupportedKey,
  validKeyRegex,
} from "../../src/functions/validation/keys";

describe("validateEmail", () => {
  it("rejects non-string input", () => {
    expect(validateEmail(null as never).isValid).toBe(false);
    expect(validateEmail(123 as never).isValid).toBe(false);
  });

  it("rejects empty after trim", () => {
    const result = validateEmail("   ");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Email cannot be empty");
  });

  it("rejects invalid format", () => {
    const result = validateEmail("not-an-email");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid email format");
  });

  it("accepts and normalizes valid business email", () => {
    const result = validateEmail("John@Company.com");
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe("john@company.com");
    expect(result.details?.isBusiness).toBe(true);
    expect(result.details?.domain).toBe("company.com");
  });

  it("marks free provider as non-business", () => {
    const result = validateEmail("user@gmail.com");
    expect(result.details?.isBusiness).toBe(false);
  });

  it("detects disposable domains", () => {
    const result = validateEmail("temp@mailinator.com");
    expect(result.details?.isDisposable).toBe(true);
  });

  it("rejects disposable when not allowed", () => {
    const result = validateEmail("temp@mailinator.com", { allowDisposable: false });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Disposable");
  });

  it("requires business email when configured", () => {
    const result = validateEmail("user@gmail.com", { requireBusiness: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Business");
  });
});

describe("normalizeEmail", () => {
  it("returns null for invalid email", () => {
    expect(normalizeEmail("bad")).toBeNull();
  });

  it("normalizes gmail dots and plus", () => {
    expect(normalizeEmail("user.name+tag@gmail.com")).toBe("username@gmail.com");
  });

  it("normalizes outlook plus addressing", () => {
    expect(normalizeEmail("user+promo@outlook.com")).toBe("user@outlook.com");
  });

  it("keeps other domains intact", () => {
    expect(normalizeEmail("user@company.com")).toBe("user@company.com");
  });
});

describe("isDisposableEmail / isBusinessEmail / getEmailDomain", () => {
  it("isDisposableEmail returns boolean", () => {
    expect(isDisposableEmail("temp@mailinator.com")).toBe(true);
    expect(isDisposableEmail("user@company.com")).toBe(false);
    expect(isDisposableEmail("bad")).toBe(false);
  });

  it("isBusinessEmail returns boolean", () => {
    expect(isBusinessEmail("user@company.com")).toBe(true);
    expect(isBusinessEmail("user@gmail.com")).toBe(false);
    expect(isBusinessEmail("bad")).toBe(false);
  });

  it("getEmailDomain extracts domain or null", () => {
    expect(getEmailDomain("user@company.com")).toBe("company.com");
    expect(getEmailDomain("bad")).toBeNull();
  });
});

describe("keys", () => {
  it("validKeyRegex accepts normal keys", () => {
    expect(validKeyRegex.test("user-profile")).toBe(true);
    expect(validKeyRegex.test("path/to/resource")).toBe(true);
    expect(validKeyRegex.test("<invalid>")).toBe(false);
  });

  it("isUnsupportedKey allows _root", () => {
    expect(isUnsupportedKey("_root")).toBe(false);
  });

  it("isUnsupportedKey rejects excluded prefixes and suffixes", () => {
    expect(isUnsupportedKey(".well-known/acme")).toBe(true);
    expect(isUnsupportedKey("script.php")).toBe(true);
    expect(isUnsupportedKey("shell.php7")).toBe(true);
    expect(isUnsupportedKey("normal-key")).toBe(false);
  });

  it("isReservedKeyGlobal detects system files", () => {
    expect(isReservedKeyGlobal("favicon.ico")).toBe(true);
    expect(isReservedKeyGlobal("robots.txt")).toBe(true);
    expect(isReservedKeyGlobal("custom-page")).toBe(false);
  });
});
