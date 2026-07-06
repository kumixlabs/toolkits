import { describe, expect, it, vi } from "vitest";

import {
  fetcher,
  fetcherSWR,
  fetchWithRetry,
  fetchWithTimeout,
  getClientIP,
  getClientIPFromHeaders,
  getRequestOrigin,
  getUserAgent,
  getUserAgentFromHeaders,
  isValidIP,
  parse,
} from "../../src/index";

describe("HTTP", () => {
  it("request should perform GET", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { message: "success" } }),
    } as any);
    const res = (await fetcher("/api/test")) as Record<string, unknown>;
    expect(res).toBeDefined();
    expect(res).toEqual({ message: "success" });
    vi.restoreAllMocks();
  });

  it("fetcher should throw on non-ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "fail" } }),
    } as any);
    await expect(fetcherSWR("/api/error")).rejects.toMatchObject({ status: 500, info: "fail" });
  });

  it("fetchWithTimeout should reject on timeout", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));
    const p = fetchWithTimeout("/slow", undefined, 100);
    vi.advanceTimersByTime(100);
    await expect(p).rejects.toThrow("Request timed out");
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetchWithRetry should retry and succeed", async () => {
    let call = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      call += 1;
      if (call < 3) {
        return { ok: false, status: 500, json: async () => ({ error: "x" }) } as any;
      }
      return { ok: true, status: 200 } as any;
    });
    const res = await fetchWithRetry("/retry", undefined, {
      maxRetries: 5,
      retryDelay: 10,
      timeout: 50,
    });
    expect(res.ok).toBe(true);
    vi.restoreAllMocks();
  });

  it("fetchWithRetry should throw forbidden for 403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 403 } as any);
    // 403 now surfaces as "Forbidden" (401 → "Unauthorized"). 401 and 403 are
    // both treated as non-retryable auth errors.
    await expect(
      fetchWithRetry("/forbidden", undefined, { maxRetries: 1, retryDelay: 1, timeout: 10 }),
    ).rejects.toThrow("Forbidden");
    vi.restoreAllMocks();
  });

  it("IP utilities should parse headers correctly", () => {
    const req = {
      headers: {
        get: (name: string) => {
          const headers: Record<string, string> = {
            "x-forwarded-for": "1.2.3.4, 5.6.7.8",
            "user-agent": "UA",
            origin: "https://x.com",
            referer: "https://ref.com",
            host: "example.com",
          };
          return headers[name] ?? null;
        },
      },
      ip: "9.9.9.9",
    };
    expect(getClientIP(req)).toBe("1.2.3.4");
    expect(isValidIP("1.2.3.4")).toBe(true);
    expect(isValidIP("::1")).toBe(true);
    expect(getUserAgent(req)).toBe("UA");
    const origin = getRequestOrigin(req);
    expect(origin.origin).toBe("https://x.com");
    expect(origin.referer).toBe("https://ref.com");
    expect(origin.host).toBe("example.com");
  });

  it("getClientIPFromHeaders and getUserAgentFromHeaders", () => {
    const headers = {
      "x-forwarded-for": "2.2.2.2, 3.3.3.3",
      "user-agent": "Mozilla",
    } as Record<string, string>;
    expect(getClientIPFromHeaders(headers)).toBe("2.2.2.2");
    expect(getUserAgentFromHeaders(headers)).toBe("Mozilla");
  });

  it("getClientIPFromHeaders falls through alt headers", () => {
    expect(getClientIPFromHeaders({ "x-real-ip": "10.0.0.1" })).toBe("10.0.0.1");
    expect(getClientIPFromHeaders({ "x-client-ip": "10.0.0.2" })).toBe("10.0.0.2");
    expect(getClientIPFromHeaders({ "cf-connecting-ip": "10.0.0.3" })).toBe("10.0.0.3");
    expect(getClientIPFromHeaders({ "x-cluster-client-ip": "10.0.0.4" })).toBe("10.0.0.4");
    expect(getClientIPFromHeaders({ "x-real-ip": "  10.0.0.5  " })).toBe("10.0.0.5");
    expect(getClientIPFromHeaders({ "x-real-ip": "unknown" })).toBe("unknown");
  });

  it("getClientIPFromHeaders parses RFC 7239 forwarded header", () => {
    expect(getClientIPFromHeaders({ forwarded: "for=192.0.2.60;proto=https" })).toBe("192.0.2.60");
    expect(getClientIPFromHeaders({ forwarded: "for=2001:db8::1" })).toBe("2001:db8::1");
    expect(getClientIPFromHeaders({ forwarded: "for=unknown" })).toBe("unknown");
  });

  it("getClientIPFromHeaders returns unknown when nothing found", () => {
    expect(getClientIPFromHeaders({})).toBe("unknown");
    expect(getClientIPFromHeaders({ "x-forwarded-for": "unknown" })).toBe("unknown");
  });

  it("getClientIPFromHeaders handles array header values", () => {
    expect(getClientIPFromHeaders({ "x-forwarded-for": ["4.4.4.4", "5.5.5.5"] } as any)).toBe(
      "4.4.4.4",
    );
  });

  it("getClientIP should parse forwarded header", () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === "forwarded") return 'for="1.1.1.1";proto=https;by=203.0.113.43';
          return null;
        },
      },
    };
    expect(getClientIP(req as any)).toBe("1.1.1.1");
  });

  it("parse should normalize request data", () => {
    const req = {
      headers: { get: (name: string) => (name === "host" ? "www.Example.com" : null) },
      nextUrl: {
        pathname: "/stats/github",
        searchParams: new URLSearchParams("page=1&limit=10"),
      },
    };
    const p = parse(req);
    expect(p.domain).toBe("example.com");
    expect(p.path).toBe("/stats/github");
    expect(p.fullPath).toBe("/stats/github?page=1&limit=10");
    expect(p.key).toBe("stats");
    expect(p.fullKey).toBe("stats/github");
    expect(p.searchParamsObj).toEqual({ page: "1", limit: "10" });
  });

  it("normalizePath should handle edge cases", async () => {
    // import inline to avoid circular
    const mod = await import("../../src/index");
    expect(mod.normalizePath("dashboard")).toBe("/dashboard");
    expect(mod.normalizePath("//a///b")).toBe("/a/b");
    expect(mod.normalizePath("/login/")).toBe("/login");
    expect(mod.normalizePath("")).toBe("/");
  });
});
