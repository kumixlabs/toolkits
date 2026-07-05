import { describe, expect, it, vi } from "vitest";
import { logger, SlackLog } from "../../src/index";

describe("Logging", () => {
  it("logger should expose methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("SlackLog should not throw when env is missing", async () => {
    const r = await SlackLog({ message: "hello", type: "alerts" });
    expect(r === undefined || typeof r === "object").toBe(true);
  });

  it("SlackLog should post when webhook is set", async () => {
    vi.resetModules();
    process.env.SLACK_WEBHOOKS_HOOK_ALERTS = "https://example.com/webhook";
    const mod = await import("../../src/index");
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    await mod.SlackLog({ message: "ping", type: "alerts" });
    expect(spy).toHaveBeenCalled();
    delete process.env.SLACK_WEBHOOKS_HOOK_ALERTS;
    spy.mockRestore();
  });

  it("SlackLog should handle fetch errors gracefully", async () => {
    vi.resetModules();
    process.env.SLACK_WEBHOOKS_HOOK_ALERTS = "https://example.com/webhook";
    const mod = await import("../../src/index");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const logSpy = vi.spyOn(mod.logger, "log").mockImplementation(() => { });
    await mod.SlackLog({ message: "error-case", type: "alerts" });
    expect(fetchSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    delete process.env.SLACK_WEBHOOKS_HOOK_ALERTS;
    fetchSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("logger should initialize with dev level in development", async () => {
    const prev = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = "development";
    const mod = await import("../../src/index");
    expect(typeof mod.logger.info).toBe("function");
    process.env.NODE_ENV = prev;
  });

  it("SlackLog should log to console in development", async () => {
    const prevEnv = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = "development";
    const mod = await import("../../src/index");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    const logSpy = vi.spyOn(mod.logger, "log").mockImplementation(() => { });
    await mod.SlackLog({ message: "dev", type: "alerts" });
    expect(logSpy).toHaveBeenCalledWith("dev");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    logSpy.mockRestore();
    process.env.NODE_ENV = prevEnv;
  });

  it("SlackLog should include mention and alert for error type", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.SLACK_WEBHOOKS_HOOK_ERRORS = "https://example.com/webhook";
    const mod = await import("../../src/index");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    await mod.SlackLog({ message: "critical", type: "errors", mention: true });
    const [, options] = fetchSpy.mock.calls[0];
    expect(JSON.stringify(options)).toContain("<@U0404G6J3NJ>");
    expect(JSON.stringify(options)).toContain(":alert:");
    delete process.env.SLACK_WEBHOOKS_HOOK_ERRORS;
    fetchSpy.mockRestore();
  });

  it("SlackLog should not include alert for non-alert types", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.SLACK_WEBHOOKS_HOOK_LINKS = "https://example.com/webhook";
    const mod = await import("../../src/index");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    await mod.SlackLog({ message: "links-msg", type: "links" });
    const [, options] = fetchSpy.mock.calls[0];
    expect(JSON.stringify(options)).not.toContain(":alert:");
    expect(JSON.stringify(options)).not.toContain("<@U0404G6J3NJ>");
    delete process.env.SLACK_WEBHOOKS_HOOK_LINKS;
    fetchSpy.mockRestore();
  });

  it("SlackLog should return early when hook is missing", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    delete process.env.SLACK_WEBHOOKS_HOOK_SUBSCRIBERS;
    const mod = await import("../../src/index");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    await mod.SlackLog({ message: "no-hook", type: "subscribers" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("SlackLog should skip console when all hooks set in production", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.SLACK_WEBHOOKS_HOOK_ALERTS = "https://example.com/a";
    process.env.SLACK_WEBHOOKS_HOOK_CRON = "https://example.com/c";
    process.env.SLACK_WEBHOOKS_HOOK_LINKS = "https://example.com/l";
    process.env.SLACK_WEBHOOKS_HOOK_SUBSCRIBERS = "https://example.com/s";
    process.env.SLACK_WEBHOOKS_HOOK_ERRORS = "https://example.com/e";
    const mod = await import("../../src/index");
    const logSpy = vi.spyOn(mod.logger, "log").mockImplementation(() => { });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as any);
    await mod.SlackLog({ message: "all-set", type: "alerts" });
    expect(logSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("logger should respect LOG_LEVEL in production", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevLevel = process.env.LOG_LEVEL;
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.LOG_LEVEL = "4";
    const mod = await import("../../src/index");
    // Exercise the logger to ensure instance created on LOG_LEVEL branch
    mod.logger.info("level4");
    process.env.NODE_ENV = prevEnv;
    process.env.LOG_LEVEL = prevLevel;
  });
});
