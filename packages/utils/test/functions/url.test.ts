import { describe, expect, it } from "vitest";
import {
  isValidUrl,
  getSearchParams,
  getSearchParamsWithArray,
  getParamsFromURL,
  constructURLFromUTMParams,
  getUrlWithoutUTMParams,
  createHref,
} from "../../src/index";

describe("URL", () => {
  it("isValidUrl should validate", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("not a url")).toBe(false);
  });

  it("search params utilities should parse correctly", () => {
    const url = "https://x.com?name=John&age=30&tag=js&tag=react";
    expect(getSearchParams(url)).toEqual({ name: "John", age: "30", tag: "react" });
    expect(getSearchParamsWithArray(url)).toEqual({ name: "John", age: "30", tag: ["js", "react"] });
    expect(getParamsFromURL("https://x.com?name=John&empty=")).toEqual({ name: "John" });
    expect(getParamsFromURL("")).toEqual({});
    expect(getParamsFromURL("not-a-url")).toEqual({});
  });

  it("utm params utilities should construct and clean URLs", () => {
    const constructed = constructURLFromUTMParams("https://example.com", {
      utm_source: "twitter",
      utm_medium: "social",
    });
    expect(constructed.includes("utm_source=twitter")).toBe(true);
    expect(constructed.includes("utm_medium=social")).toBe(true);

    const updated = constructURLFromUTMParams("https://example.com?utm_source=google", {
      utm_source: "twitter",
      utm_medium: "",
    });
    expect(updated.includes("utm_source=twitter")).toBe(true);
    expect(updated.includes("utm_medium")).toBe(false);

    const plus = constructURLFromUTMParams("https://example.com", {
      utm_content: "logo+link",
    });
    const urlObj = new URL(plus);
    expect(urlObj.searchParams.get("utm_content")).toBe("logo link");

    const cleaned = getUrlWithoutUTMParams(
      "https://example.com?utm_source=twitter&utm_medium=social&page=2",
    );
    expect(cleaned).toBe("https://example.com/?page=2");

    expect(getUrlWithoutUTMParams("not-a-url")).toBe("not-a-url");
  });

  it("createHref should add utm params when provided", () => {
    const href = createHref("/features", "https://domain.com", {
      utm_source: "twitter",
      utm_medium: "social",
    });
    expect(href.startsWith("https://domain.com/")).toBe(true);
    expect(href.includes("utm_source=twitter")).toBe(true);
    expect(href.includes("utm_medium=social")).toBe(true);
  });

  it("constructURLFromUTMParams should return empty string on invalid URL", () => {
    const result = constructURLFromUTMParams("not-a-url", { utm_source: "x" });
    expect(result).toBe("");
  });

  it("createHref should not append params when none provided", () => {
    const href = createHref("/features", "https://domain.com");
    expect(href).toBe("https://domain.com/features");
  });
});
