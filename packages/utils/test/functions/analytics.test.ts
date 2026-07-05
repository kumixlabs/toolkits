import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  googleTrackCodeCopy,
  googleTrackDirectionChange,
  googleTrackEvent,
  googleTrackItemCreate,
  googleTrackItemDelete,
  googleTrackItemRestore,
  googleTrackItemUpdate,
  googleTrackItemView,
  googleTrackThemeChange,
  googleTrackViewChange,
} from "../../src/functions/analytics/google";

describe("googleTrackEvent", () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    (globalThis as { window?: unknown }).window = { gtag };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
    vi.restoreAllMocks();
  });

  it("sends event with defaults", () => {
    googleTrackEvent({ name: "signup", properties: { plan: "pro" } });
    expect(gtag).toHaveBeenCalledWith("event", "signup", expect.objectContaining({
      plan: "pro",
      event_category: "engagement",
    }));
  });

  it("uses provided category", () => {
    googleTrackEvent({ name: "signup", properties: { category: "crud" } });
    expect(gtag).toHaveBeenCalledWith("event", "signup", expect.objectContaining({
      event_category: "crud",
    }));
  });

  it("skips when name is empty", () => {
    googleTrackEvent({ name: "  " });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("skips when properties is not an object", () => {
    googleTrackEvent({ name: "e", properties: "bad" as never });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("does not throw when gtag missing", () => {
    (globalThis as { window?: unknown }).window = {};
    expect(() => googleTrackEvent({ name: "e" })).not.toThrow();
  });
});

describe("google tracking helpers", () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    (globalThis as { window?: unknown }).window = { gtag };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("googleTrackCodeCopy tracks doc_copy", () => {
    googleTrackCodeCopy("button/primary");
    expect(gtag).toHaveBeenCalledWith("event", "doc_copy", expect.anything());
  });

  it("googleTrackCodeCopy skips on invalid path", () => {
    googleTrackCodeCopy("" as never);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackThemeChange validates theme", () => {
    googleTrackThemeChange("comp", "dark");
    expect(gtag).toHaveBeenCalledWith("event", "doc_select_theme", expect.anything());
    gtag.mockClear();
    googleTrackThemeChange("comp", "blue" as never);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackThemeChange skips invalid path", () => {
    googleTrackThemeChange("" as never, "dark");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackDirectionChange validates direction", () => {
    googleTrackDirectionChange("comp", "rtl");
    expect(gtag).toHaveBeenCalledWith("event", "doc_select_direction", expect.anything());
    gtag.mockClear();
    googleTrackDirectionChange("comp", "up" as never);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackDirectionChange skips invalid path", () => {
    googleTrackDirectionChange("" as never, "rtl");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackViewChange validates view", () => {
    googleTrackViewChange("comp", "code");
    expect(gtag).toHaveBeenCalledWith("event", "doc_select_view", expect.anything());
    gtag.mockClear();
    googleTrackViewChange("comp", "xml" as never);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackViewChange skips invalid path", () => {
    googleTrackViewChange("" as never, "code");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackItemCreate tracks with and without id", () => {
    googleTrackItemCreate("billing", "invoice", 10);
    googleTrackItemCreate("billing", "invoice");
    expect(gtag).toHaveBeenCalledTimes(2);
  });

  it("googleTrackItemCreate skips on missing module or type", () => {
    googleTrackItemCreate("", "invoice");
    googleTrackItemCreate("billing", "");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackItemView requires id", () => {
    googleTrackItemView("billing", "invoice", 1);
    expect(gtag).toHaveBeenCalledTimes(1);
    gtag.mockClear();
    googleTrackItemView("billing", "invoice", "");
    googleTrackItemView("", "invoice", 1);
    googleTrackItemView("billing", "", 1);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackItemUpdate requires id", () => {
    googleTrackItemUpdate("billing", "invoice", 1);
    expect(gtag).toHaveBeenCalledTimes(1);
    gtag.mockClear();
    googleTrackItemUpdate("billing", "invoice", "");
    googleTrackItemUpdate("", "invoice", 1);
    googleTrackItemUpdate("billing", "", 1);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackItemDelete tracks hard and soft", () => {
    googleTrackItemDelete("billing", "invoice", 1, true);
    googleTrackItemDelete("billing", "invoice", 1);
    expect(gtag).toHaveBeenCalledTimes(2);
    gtag.mockClear();
    googleTrackItemDelete("billing", "invoice", "");
    googleTrackItemDelete("", "invoice", 1);
    googleTrackItemDelete("billing", "", 1);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("googleTrackItemRestore requires id", () => {
    googleTrackItemRestore("billing", "invoice", 1);
    expect(gtag).toHaveBeenCalledTimes(1);
    gtag.mockClear();
    googleTrackItemRestore("billing", "invoice", "");
    googleTrackItemRestore("", "invoice", 1);
    googleTrackItemRestore("billing", "", 1);
    expect(gtag).not.toHaveBeenCalled();
  });
});
