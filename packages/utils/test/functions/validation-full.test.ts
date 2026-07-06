import { describe, expect, it, vi } from "vitest";

import { deepEqual, isIframeable } from "../../src/index";

describe("deepEqual — comprehensive", () => {
  it("primitives: same reference and strict equality", () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
    expect(deepEqual({} as any, {} as any)).toBe(true);
  });

  it("null / non-object mismatches", () => {
    expect(deepEqual(null as any, null as any)).toBe(true);
    expect(deepEqual(null as any, {} as any)).toBe(false);
    expect(deepEqual({} as any, null as any)).toBe(false);
    expect(deepEqual(undefined as any, undefined as any)).toBe(true);
    expect(deepEqual(1 as any, "1" as any)).toBe(false);
  });

  it("type-tag mismatch (Date vs Object)", () => {
    expect(deepEqual(new Date() as any, { getTime: () => 0 } as any)).toBe(false);
  });

  it("Date comparison", () => {
    const d1 = new Date("2024-01-01");
    const d2 = new Date("2024-01-01");
    const d3 = new Date("2024-06-01");
    expect(deepEqual(d1 as any, d2 as any)).toBe(true);
    expect(deepEqual(d1 as any, d3 as any)).toBe(false);
  });

  it("RegExp comparison", () => {
    expect(deepEqual(/foo/g as any, /foo/g as any)).toBe(true);
    expect(deepEqual(/foo/g as any, /foo/i as any)).toBe(false);
    expect(deepEqual(/foo/ as any, /bar/ as any)).toBe(false);
  });

  it("Array comparison", () => {
    expect(deepEqual([1, 2, 3] as any, [1, 2, 3] as any)).toBe(true);
    expect(deepEqual([1, [2, 3]] as any, [1, [2, 3]] as any)).toBe(true);
    expect(deepEqual([1, 2] as any, [1, 2, 3] as any)).toBe(false);
    expect(deepEqual([1, 2, 3] as any, [1, 2, 4] as any)).toBe(false);
    expect(deepEqual([1] as any, [2] as any)).toBe(false);
  });

  it("Map comparison", () => {
    const m1 = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    const m2 = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    const m3 = new Map([["a", 1]]);
    const m4 = new Map([
      ["a", 1],
      ["b", 3],
    ]);
    expect(deepEqual(m1 as any, m2 as any)).toBe(true);
    expect(deepEqual(m1 as any, m3 as any)).toBe(false);
    expect(deepEqual(m1 as any, m4 as any)).toBe(false);
  });

  it("Set comparison", () => {
    const s1 = new Set([1, 2, 3]);
    const s2 = new Set([1, 2, 3]);
    const s3 = new Set([3, 2, 1]);
    const s4 = new Set([1, 2]);
    const s5 = new Set([1, 2, 4]);
    expect(deepEqual(s1 as any, s2 as any)).toBe(true);
    expect(deepEqual(s1 as any, s3 as any)).toBe(true);
    expect(deepEqual(s1 as any, s4 as any)).toBe(false);
    expect(deepEqual(s1 as any, s5 as any)).toBe(false);
  });

  it("Set with object members", () => {
    const s1 = new Set([{ a: 1 }, { b: 2 }]);
    const s2 = new Set([{ b: 2 }, { a: 1 }]);
    expect(deepEqual(s1 as any, s2 as any)).toBe(true);
  });

  it("plain objects: key-length mismatch and nested", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqual({ a: { c: { d: 4 } } }, { a: { c: { d: 4 } } })).toBe(true);
    expect(deepEqual({ a: 1, b: true }, { a: 1, b: true })).toBe(true);
    expect(deepEqual({ a: 1, b: false }, { a: 1, b: true })).toBe(false);
  });
});

describe("isIframeable — comprehensive", () => {
  it("returns true when response not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      headers: { get: () => null },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://app.com" });
    expect(result).toBe(true);
  });

  it("handles 'self' CSP directive with matching origin", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      url: "https://x.com",
      headers: {
        get: (name: string) =>
          name === "content-security-policy" ? "frame-ancestors 'self'" : null,
      },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://x.com" });
    expect(result).toBe(true);
  });

  it("handles 'self' CSP directive with non-matching origin", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      url: "https://x.com",
      headers: {
        get: (name: string) =>
          name === "content-security-policy" ? "frame-ancestors 'self'" : null,
      },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://other.com" });
    expect(result).toBe(false);
  });

  it("handles wildcard subdomain CSP", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-security-policy" ? "frame-ancestors https://*.app.com" : null,
      },
    } as any);
    const result = await isIframeable({
      url: "https://x.com",
      requestDomain: "https://sub.app.com",
    });
    expect(result).toBe(true);
  });

  it("handles 'none' CSP directive", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-security-policy" ? "frame-ancestors 'none'" : null,
      },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://app.com" });
    expect(result).toBe(false);
  });

  it("allows when no restrictive headers present", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://app.com" });
    expect(result).toBe(true);
  });

  it("denies on ALLOW-FROM (deprecated, always deny)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "X-Frame-Options" ? "ALLOW-FROM https://app.com" : null),
      },
    } as any);
    const result = await isIframeable({ url: "https://x.com", requestDomain: "https://app.com" });
    expect(result).toBe(false);
  });
});
