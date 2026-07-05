import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyRecaptchaToken } from "../../src/functions/http/recaptcha";
import { getIPAddress } from "../../src/functions/http/ip";
import { fetcher, fetcherSWR } from "../../src/functions/http/fetcher";
import { fetchWithTimeout } from "../../src/functions/http/fetch-with-timeout";
import { fetchWithRetry } from "../../src/functions/http/fetch-with-retry";

vi.mock("../../src/constants/env", () => ({
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "test-site-key",
}));

describe("verifyRecaptchaToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when verification succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: true }),
    } as Response);
    expect(await verifyRecaptchaToken("token")).toBe(true);
  });

  it("returns false when verification fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: false, "error-codes": ["bad"] }),
    } as Response);
    expect(await verifyRecaptchaToken("token")).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
    const result = await verifyRecaptchaToken("token");
    expect(result).toBe(false);
  });
});

describe("fetcher / fetcherSWR", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetcher sends JSON body and returns data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 1 } }),
    } as Response);
    const res = await fetcher<{ id: number }>("/api", "POST", { name: "x" });
    expect(res).toEqual({ id: 1 });
  });

  it("fetcher sends FormData bodies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: "ok" }),
    } as Response);
    const form = new FormData();
    form.append("file", "content");
    const res = await fetcher("/upload", "POST", form);
    expect(res).toBe("ok");
  });

  it("fetcher respects custom headers and log option", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: "ok" }),
    } as Response);
    const res = await fetcher("/api", "GET", undefined, {
      headers: { Authorization: "Bearer x" },
      log: true,
    });
    expect(res).toBe("ok");
  });

  it("fetcherSWR returns data on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ value: 1 }),
    } as Response);
    expect(await fetcherSWR("/ok")).toEqual({ value: 1 });
  });

  it("fetcherSWR uses default message when none provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);
    await expect(fetcherSWR("/err")).rejects.toMatchObject({ status: 500 });
  });
});

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves when fetch succeeds before timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true } as Response);
    const res = await fetchWithTimeout("/fast");
    expect(res.ok).toBe(true);
  });

  it("rejects when fetch itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("boom"));
    await expect(fetchWithTimeout("/bad")).rejects.toThrow("boom");
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws non-ok error message after retries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "bad request" }),
    } as Response);
    await expect(
      fetchWithRetry("/err", undefined, { maxRetries: 1, retryDelay: 1, timeout: 20 }),
    ).rejects.toThrow(/bad request|Failed after/);
  });

  it("throws after exhausting retries on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("net"));
    await expect(
      fetchWithRetry("/net", undefined, { maxRetries: 2, retryDelay: 1, timeout: 20 }),
    ).rejects.toThrow(/Failed after/);
  });
});

describe("getIPAddress", () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    (globalThis as { window?: unknown }).window = originalWindow;
    vi.restoreAllMocks();
  });

  it("returns unknown outside the browser", async () => {
    (globalThis as { window?: unknown }).window = undefined;
    expect(await getIPAddress()).toBe("unknown");
  });

  it("returns ip from the first successful provider", async () => {
    (globalThis as { window?: unknown }).window = {};
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ip: "203.0.113.42" }),
    } as Response);
    expect(await getIPAddress()).toBe("203.0.113.42");
  });

  it("falls through providers until one returns an ip", async () => {
    (globalThis as { window?: unknown }).window = {};
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce({ ok: false } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query: "198.51.100.7" }),
    } as Response);
    expect(await getIPAddress()).toBe("198.51.100.7");
  });

  it("continues when a provider throws", async () => {
    (globalThis as { window?: unknown }).window = {};
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ipAddress: "192.0.2.5" }),
    } as Response);
    expect(await getIPAddress()).toBe("192.0.2.5");
  });

  it("returns unknown when all providers fail", async () => {
    (globalThis as { window?: unknown }).window = {};
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as Response);
    expect(await getIPAddress()).toBe("unknown");
  });
});
