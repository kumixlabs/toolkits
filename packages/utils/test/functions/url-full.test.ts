import { describe, expect, it } from "vitest";

import {
  generateDomainFromName,
  getApexDomain,
  getDomainWithoutWWW,
  getSubdomain,
  validDomainRegex,
  validSlugRegex,
} from "../../src/functions/url/domains";
import { linkConstructor, linkConstructorSimple } from "../../src/functions/url/link-constructor";
import {
  getUrlFromString,
  getUrlFromStringIfValid,
  getUrlObjFromString,
} from "../../src/functions/url/url-conversion";
import { getPrettyUrl, getSlug } from "../../src/functions/url/url-formatting";

describe("url-conversion", () => {
  it("getUrlFromString returns valid url unchanged", () => {
    expect(getUrlFromString("https://example.com")).toBe("https://example.com");
  });

  it("getUrlFromString prepends https for domain-like strings", () => {
    expect(getUrlFromString("example.com")).toBe("https://example.com/");
  });

  it("getUrlFromString returns original for non-url text", () => {
    expect(getUrlFromString("not a url")).toBe("not a url");
  });

  it("getUrlFromString returns original when no dot", () => {
    expect(getUrlFromString("localhost")).toBe("localhost");
  });

  it("getUrlObjFromString returns URL for valid url", () => {
    const url = getUrlObjFromString("https://example.com");
    expect(url).toBeInstanceOf(URL);
    expect(url?.hostname).toBe("example.com");
  });

  it("getUrlObjFromString builds URL from bare domain", () => {
    const url = getUrlObjFromString("example.com");
    expect(url?.toString()).toBe("https://example.com/");
  });

  it("getUrlObjFromString returns null for invalid", () => {
    expect(getUrlObjFromString("not a url")).toBeNull();
  });

  it("getUrlFromStringIfValid returns valid url", () => {
    expect(getUrlFromStringIfValid("https://example.com")).toBe("https://example.com");
  });

  it("getUrlFromStringIfValid builds from bare domain", () => {
    expect(getUrlFromStringIfValid("example.com")).toBe("https://example.com/");
  });

  it("getUrlFromStringIfValid returns null for text", () => {
    expect(getUrlFromStringIfValid("just text")).toBeNull();
  });
});

describe("domains", () => {
  it("generateDomainFromName returns empty for short names", () => {
    expect(generateDomainFromName("ab")).toBe("");
  });

  it("generateDomainFromName uses default extension with shortest form", () => {
    expect(generateDomainFromName("My Cool Project")).toBe("myclprjct.link");
  });

  it("generateDomainFromName uses custom extension", () => {
    expect(generateDomainFromName("My Cool Project", "com")).toBe("myclprjct.com");
  });

  it("generateDomainFromName returns a dotted domain for valid names", () => {
    const result = generateDomainFromName("Digital", "io");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(".");
  });

  it("validDomainRegex matches valid domains", () => {
    expect(validDomainRegex.test("example.com")).toBe(true);
    expect(validDomainRegex.test("sub.example.co.uk")).toBe(true);
    expect(validDomainRegex.test("invalid domain")).toBe(false);
  });

  it("validSlugRegex validates slugs", () => {
    expect(validSlugRegex.test("my-page")).toBe(true);
    expect(validSlugRegex.test("invalid_slug")).toBe(false);
  });

  it("getSubdomain returns null when equal to apex", () => {
    expect(getSubdomain("example.com", "example.com")).toBeNull();
  });

  it("getSubdomain extracts subdomain", () => {
    expect(getSubdomain("app.example.com", "example.com")).toBe("app");
    expect(getSubdomain("dev.app.example.com", "example.com")).toBe("dev.app");
  });

  it("getApexDomain handles plain domains", () => {
    expect(getApexDomain("https://example.com/page")).toBe("example.com");
  });

  it("getApexDomain strips subdomains", () => {
    expect(getApexDomain("https://app.example.com")).toBe("example.com");
  });

  it("getApexDomain returns youtube for youtu.be", () => {
    expect(getApexDomain("https://youtu.be/12345")).toBe("youtube.com");
  });

  it("getApexDomain handles second-level TLDs", () => {
    expect(getApexDomain("https://example.co.uk")).toBe("example.co.uk");
  });

  it("getApexDomain returns empty on invalid url", () => {
    expect(getApexDomain("::::")).toBe("");
  });

  it("getApexDomain rewrites custom schemes", () => {
    expect(getApexDomain("notion://example.com/page")).toBe("example.com");
  });

  it("getDomainWithoutWWW removes www prefix", () => {
    expect(getDomainWithoutWWW("https://www.example.com")).toBe("example.com");
  });

  it("getDomainWithoutWWW handles bare domain", () => {
    expect(getDomainWithoutWWW("www.example.com")).toBe("example.com");
  });

  it("getDomainWithoutWWW returns undefined for invalid", () => {
    expect(getDomainWithoutWWW("not a domain")).toBeUndefined();
  });
});

describe("url-formatting", () => {
  it("getPrettyUrl removes protocol and www", () => {
    expect(getPrettyUrl("https://www.example.com")).toBe("example.com");
  });

  it("getPrettyUrl removes trailing slash", () => {
    expect(getPrettyUrl("https://example.com/")).toBe("example.com");
  });

  it("getPrettyUrl returns empty for nullish", () => {
    expect(getPrettyUrl(null)).toBe("");
    expect(getPrettyUrl(undefined)).toBe("");
  });

  it("getSlug builds url-safe slugs", () => {
    expect(getSlug("Hello World")).toBe("hello-world");
    expect(getSlug("Café & Restaurant!")).toBe("cafe-restaurant");
    expect(getSlug("100% Success Rate")).toBe("100-success-rate");
  });

  it("getSlug handles empty and invalid input", () => {
    expect(getSlug("")).toBe("");
    expect(getSlug("   ")).toBe("");
    expect(getSlug("---")).toBe("");
    expect(getSlug(null as never)).toBe("");
  });
});

describe("link-constructor", () => {
  it("returns empty when no domain", () => {
    expect(linkConstructor({})).toBe("");
  });

  it("builds url with key", () => {
    expect(linkConstructor({ domain: "example.com", key: "page" })).toBe(
      "https://example.com/page",
    );
  });

  it("omits key when _root", () => {
    expect(linkConstructor({ domain: "example.com", key: "_root" })).toBe("https://example.com");
  });

  it("adds search params", () => {
    expect(
      linkConstructor({ domain: "example.com", key: "search", searchParams: { q: "x" } }),
    ).toBe("https://example.com/search?q=x");
  });

  it("pretty removes protocol", () => {
    expect(linkConstructor({ domain: "example.com", key: "about", pretty: true })).toBe(
      "example.com/about",
    );
  });

  it("linkConstructorSimple builds url", () => {
    expect(linkConstructorSimple({ domain: "example.com", key: "page" })).toBe(
      "https://example.com/page",
    );
  });

  it("linkConstructorSimple omits _root", () => {
    expect(linkConstructorSimple({ domain: "example.com", key: "_root" })).toBe(
      "https://example.com",
    );
  });
});
