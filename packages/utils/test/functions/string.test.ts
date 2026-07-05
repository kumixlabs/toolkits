import { describe, expect, it, vi } from "vitest";
import {
  capitalize,
  truncate,
  currencyFormatter,
  cn,
  getInitials,
  toCamelCase,
  combineWords,
  nFormatter,
  normalizeString,
  pluralize,
  regexEscape,
  smartTruncate,
  trim,
  assetsUrl,
  getFlagUrl,
} from "../../src/index";

describe("String", () => {
  it("capitalize should format words", () => {
    expect(capitalize("hello world")).toBe("Hello World");
    expect(capitalize("a b c")).toBe("A B C");
    expect(capitalize("")).toBe("");
    expect(capitalize(null as any)).toBe(null);
    expect(capitalize(undefined as any)).toBeUndefined();
  });

  it("truncate should shorten strings", () => {
    expect(truncate("Hello Kumix", 5)).toBe("He...");
    expect(truncate("Hi", 5)).toBe("Hi");
  });

  it("currencyFormatter should format currency", () => {
    expect(currencyFormatter(1000)).toBe("$1,000");
    expect(currencyFormatter(1234.56, { maximumFractionDigits: 2 })).toBe("$1,234.56");
    const eur = currencyFormatter(1000, {}, "en-US", "EUR");
    expect(eur.includes("€")).toBe(true);
  });

  it("cn should merge tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("hidden", "block")).toBe("block");
    expect(cn("text-sm", false && "text-lg")).toBe("text-sm");
  });

  it("getInitials should derive initials", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("single")).toBe("S");
    expect(getInitials("John Michael Doe", 2)).toBe("JM");
    expect(getInitials("John Doe", 1)).toBe("J");
    expect(getInitials("")).toBe("");
    expect(getInitials(null as any)).toBe("");
  });

  it("toCamelCase should convert snake_case", () => {
    expect(toCamelCase("user_name")).toBe("userName");
    expect(toCamelCase("first_name_last_name")).toBe("firstNameLastName");
    expect(toCamelCase("alreadyCamel")).toBe("alreadyCamel");
  });

  it("combineWords should join with and", () => {
    expect(combineWords(["apple", "banana", "orange"])).toBe("apple, banana and orange");
    expect(combineWords(["apple", "banana"])).toBe("apple and banana");
    expect(combineWords(["apple"])).toBe("apple");
    expect(combineWords([])).toBe("");
  });

  it("nFormatter should format numbers", () => {
    expect(nFormatter(1500)).toBe("1.5K");
    expect(nFormatter(1500, { digits: 2 })).toBe("1.5K");
    expect(nFormatter(0.75, { digits: 2 })).toBe("0.75");
    expect(nFormatter(1500, { full: true })).toBe("1,500");
    expect(nFormatter(undefined)).toBe("0");
  });

  it("normalizeString should clean special chars and spaces", () => {
    expect(normalizeString("\uFEFFHello   World")).toBe("hello world");
    expect(normalizeString("HeLLo WoRLd")).toBe("hello world");
    expect(normalizeString("")).toBe("");
  });

  it("normalizeString should still work in development mode", async () => {
    const prev = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = "development";
    const mod = await import("../../src/index");
    expect(mod.normalizeString("\uFEFFDev   Mode")).toBe("dev mode");
    process.env.NODE_ENV = prev;
  });

  it("pluralize should select correct form", () => {
    expect(pluralize("item", 1)).toBe("item");
    expect(pluralize("item", 2)).toBe("items");
    expect(pluralize("category", 2, { plural: "categories" })).toBe("categories");
  });

  it("regexEscape should escape regex characters", () => {
    expect(regexEscape("(test)[123]+?")).toBe("\\(test\\)\\[123\\]\\+\\?");
  });

  it("smartTruncate should preserve domain and path", () => {
    const s = smartTruncate("example.com/very/long/path/to/resource", 25);
    expect(s.includes("...")).toBe(true);
    expect(s.includes("com/")).toBe(true);
  });

  it("smartTruncate should return original when short", () => {
    const s = smartTruncate("example.com/path", 25);
    expect(s).toBe("example.com/path");
  });

  it("smartTruncate should truncate long domain with short path", () => {
    const s = smartTruncate("verylongdomainname.com/path", 25);
    expect(s).toContain("...com/path");
  });

  it("trim should handle non-string values", () => {
    expect(trim("  hi  ")).toBe("hi");
    expect(trim(123)).toBe(123);
    expect(trim(null)).toBeNull();
  });

  it("assetsUrl should build absolute URLs", () => {
    const url = assetsUrl("logo/logo.png", "https://cdn.example.com");
    expect(url).toBe("https://cdn.example.com/logo/logo.png");
    const passthrough = assetsUrl("https://other.com/a.png", "https://cdn.example.com");
    expect(passthrough).toBe("https://other.com/a.png");
    const base = assetsUrl("", "https://cdn.example.com");
    expect(base).toBe("https://cdn.example.com");
  });

  it("getFlagUrl should create flag URL", () => {
    const u = getFlagUrl("US");
    expect(u.endsWith("/us.svg")).toBe(true);
  });
});
