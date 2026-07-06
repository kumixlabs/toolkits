// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearAllCookies,
  getAllCookies,
  getCookie,
  hasCookie,
  removeCookie,
  setCookie,
} from "../../src/functions/browser/cookies";
import {
  clearStorage,
  getStorageItem,
  hasStorageItem,
  removeStorageItem,
  setStorageItem,
} from "../../src/functions/browser/storage";

describe("browser storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sets and gets an item", () => {
    setStorageItem("user", { id: 1 });
    expect(getStorageItem<{ id: number }>("user")).toEqual({ id: 1 });
  });

  it("returns default when key missing", () => {
    expect(getStorageItem("missing", "localStorage", "fallback")).toBe("fallback");
  });

  it("returns default on parse error", () => {
    localStorage.setItem("bad", "{not json");
    expect(getStorageItem("bad", "localStorage", "def")).toBe("def");
  });

  it("supports sessionStorage", () => {
    setStorageItem("temp", "x", "sessionStorage");
    expect(getStorageItem("temp", "sessionStorage")).toBe("x");
  });

  it("removes an item", () => {
    setStorageItem("gone", 1);
    removeStorageItem("gone");
    expect(hasStorageItem("gone")).toBe(false);
  });

  it("hasStorageItem detects existence", () => {
    setStorageItem("exists", 1);
    expect(hasStorageItem("exists")).toBe(true);
    expect(hasStorageItem("nope")).toBe(false);
  });

  it("clears storage", () => {
    setStorageItem("a", 1);
    setStorageItem("b", 2);
    clearStorage();
    expect(hasStorageItem("a")).toBe(false);
    expect(hasStorageItem("b")).toBe(false);
  });
});

describe("browser cookies", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("sets and gets a cookie", () => {
    expect(setCookie("username", "john")).toBe(true);
    expect(getCookie<string>("username")).toBe("john");
  });

  it("sets a cookie with options", () => {
    const ok = setCookie(
      "prefs",
      { theme: "dark" },
      {
        expires: 7,
        path: "/",
        domain: "localhost",
        secure: false,
        sameSite: "strict",
      },
    );
    expect(ok).toBe(true);
    expect(getCookie<{ theme: string }>("prefs")).toEqual({ theme: "dark" });
  });

  it("returns null when cookie not found", () => {
    expect(getCookie("nope")).toBeNull();
  });

  it("hasCookie detects existence", () => {
    setCookie("token", "abc");
    expect(hasCookie("token")).toBe(true);
    expect(hasCookie("absent")).toBe(false);
  });

  it("removes a cookie", () => {
    setCookie("temp", "1");
    expect(removeCookie("temp")).toBe(true);
    expect(hasCookie("temp")).toBe(false);
  });

  it("getAllCookies returns object", () => {
    setCookie("one", "1");
    setCookie("two", "2");
    const all = getAllCookies();
    expect(all.one).toBe("1");
    expect(all.two).toBe("2");
  });

  it("clearAllCookies removes all and returns count", () => {
    setCookie("a", "1");
    setCookie("b", "2");
    const count = clearAllCookies();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("reads a raw cookie set without wrapper", () => {
    // biome-ignore lint/suspicious/noDocumentCookie: testing the raw-cookie read path
    document.cookie = `${encodeURIComponent("raw")}=${encodeURIComponent("plainvalue")}`;
    expect(getCookie<string>("raw")).toBe("plainvalue");
  });
});
