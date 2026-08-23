import { describe, expect, it } from "vitest";

import {
  isReservedKeyGlobal,
  isUnsupportedKey,
  validKeyRegex,
} from "../../src/functions/validation/keys";

describe("validKeyRegex", () => {
  it("accepts letters, numbers, separators and emojis", () => {
    expect(validKeyRegex.test("user-profile")).toBe(true);
    expect(validKeyRegex.test("path/to/resource")).toBe(true);
    expect(validKeyRegex.test("emoji-😊-key")).toBe(true);
    expect(validKeyRegex.test("UPPER_lower.123")).toBe(true);
  });

  it("rejects keys with disallowed characters", () => {
    expect(validKeyRegex.test("<invalid>")).toBe(false);
    expect(validKeyRegex.test("key with spaces")).toBe(false);
    expect(validKeyRegex.test("key%percent")).toBe(false);
  });
});

describe("isUnsupportedKey", () => {
  it("supports the special _root key", () => {
    expect(isUnsupportedKey("_root")).toBe(false);
  });

  it("rejects well-known prefixes and php suffixes", () => {
    expect(isUnsupportedKey(".well-known/acme-challenge")).toBe(true);
    expect(isUnsupportedKey("script.php")).toBe(true);
    expect(isUnsupportedKey("legacy.php7")).toBe(true);
  });

  it("supports normal keys", () => {
    expect(isUnsupportedKey("normal-key")).toBe(false);
  });
});

describe("isReservedKeyGlobal", () => {
  it("flags system-reserved files", () => {
    expect(isReservedKeyGlobal("favicon.ico")).toBe(true);
    expect(isReservedKeyGlobal("sitemap.xml")).toBe(true);
    expect(isReservedKeyGlobal("robots.txt")).toBe(true);
    expect(isReservedKeyGlobal("manifest.webmanifest")).toBe(true);
    expect(isReservedKeyGlobal("manifest.json")).toBe(true);
    expect(isReservedKeyGlobal("apple-app-site-association")).toBe(true);
  });

  it("allows user keys", () => {
    expect(isReservedKeyGlobal("custom-page")).toBe(false);
  });
});
