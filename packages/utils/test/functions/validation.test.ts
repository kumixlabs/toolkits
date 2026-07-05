import { describe, expect, it, vi } from "vitest";
import {
  validateEmail,
  normalizeEmail,
  isDisposableEmail,
  isBusinessEmail,
  getEmailDomain,
  deepEqual,
  isIframeable,
} from "../../src/index";

describe("Validation", () => {
  it("validateEmail should validate formats", () => {
    const ok = validateEmail("user@example.com");
    expect(ok.isValid).toBe(true);
    expect(ok.normalized).toBe("user@example.com");
    expect(ok.details?.domain).toBe("example.com");

    expect(validateEmail("").isValid).toBe(false);
    expect(validateEmail("invalid").isValid).toBe(false);
    expect(validateEmail("@example.com").isValid).toBe(false);
    expect(validateEmail("user@").isValid).toBe(false);
  });

  it("normalizeEmail should normalize providers", () => {
    expect(normalizeEmail("  USER@EXAMPLE.COM  ")).toBe("user@example.com");
    expect(normalizeEmail("user.name+tag@gmail.com")).toBe("username@gmail.com");
  });

  it("disposable and business checks", () => {
    expect(isDisposableEmail("a@10minutemail.com")).toBe(true);
    expect(isBusinessEmail("john@company.com")).toBe(true);
    expect(getEmailDomain("user@example.com")).toBe("example.com");
  });

  it("deepEqual should compare deeply", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(deepEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
    expect(deepEqual({ a: { b: 2 } }, { a: { b: 3 } })).toBe(false);
    // type mismatch
    expect(deepEqual({ a: 1 } as any, 1 as any)).toBe(false);
    // different keys
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("isIframeable should respect headers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-security-policy" ? "frame-ancestors https://myapp.com" : null,
      },
    } as any);
    const allowed = await isIframeable({ url: "https://x.com", requestDomain: "https://myapp.com" });
    expect(allowed).toBe(true);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "X-Frame-Options" ? "DENY" : null),
      },
    } as any);
    const denied = await isIframeable({ url: "https://x.com", requestDomain: "https://myapp.com" });
    expect(denied).toBe(false);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "content-security-policy" ? "frame-ancestors *" : null),
      },
    } as any);
    const wildcard = await isIframeable({ url: "https://x.com", requestDomain: "https://other.com" });
    expect(wildcard).toBe(true);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "X-Frame-Options" ? "SAMEORIGIN" : null),
      },
    } as any);
    const sameorigin = await isIframeable({ url: "https://x.com", requestDomain: "https://myapp.com" });
    expect(sameorigin).toBe(false);
  });
});
