import { describe, expect, it } from "vitest";

import {
  THEME_MODES,
  META_THEME_COLORS,
  DEFAULT_THEME_MODE,
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  SLACK_WEBHOOKS,
  OG_AVATAR_URL,
  PAGINATION_LIMIT,
  TWO_WEEKS_IN_SECONDS,
  THE_BEGINNING_OF_TIME,
  INFINITY_NUMBER,
  REDIRECT_QUERY_PARAM,
  NODE_ENV,
  isDevelopment,
  isStaging,
  isProduction,
  LOG_LEVEL,
  LOCALHOST_GEO_DATA,
  LOCALHOST_IP,
  RESERVED_SLUGS,
  CONTINENTS,
  CONTINENT_CODES,
  ccTLDs,
  SPECIAL_APEX_DOMAINS,
} from "../src/index";

describe("Constants", () => {
  describe("Colors", () => {
    it("should expose theme modes and meta colors", () => {
      expect(THEME_MODES.LIGHT).toBe("light");
      expect(THEME_MODES.DARK).toBe("dark");
      expect(THEME_MODES.SYSTEM).toBe("system");
      expect(META_THEME_COLORS[THEME_MODES.LIGHT]).toBe("#ffffff");
      expect(META_THEME_COLORS[THEME_MODES.DARK]).toBe("#09090b");
      expect(DEFAULT_THEME_MODE).toBe("system");
    });
  });

  describe("Env", () => {
    it("should expose env constants with expected defaults", () => {
      expect(NEXT_PUBLIC_RECAPTCHA_SITE_KEY === undefined || typeof NEXT_PUBLIC_RECAPTCHA_SITE_KEY === "string").toBe(
        true,
      );
      expect(SLACK_WEBHOOKS.ALERTS).toBeUndefined();
      expect(SLACK_WEBHOOKS.CRON).toBeUndefined();
      expect(SLACK_WEBHOOKS.LINKS).toBeUndefined();
      expect(SLACK_WEBHOOKS.SUBSCRIBERS).toBeUndefined();
      expect(SLACK_WEBHOOKS.ERRORS).toBeUndefined();
      expect(OG_AVATAR_URL).toContain("https://");
      expect(PAGINATION_LIMIT).toBe(100);
      expect(TWO_WEEKS_IN_SECONDS).toBe(60 * 60 * 24 * 14);
      expect(THE_BEGINNING_OF_TIME instanceof Date).toBe(true);
      expect(INFINITY_NUMBER).toBe(1000000000);
      expect(REDIRECT_QUERY_PARAM).toBe("redirectTo");
    });
  });

  describe("Development", () => {
    it("should reflect test env flags", () => {
      expect(NODE_ENV).toBe("test");
      expect(isDevelopment).toBe(false);
      expect(isStaging).toBe(true);
      expect(isProduction).toBe(false);
      expect(LOG_LEVEL === undefined || typeof LOG_LEVEL === "string").toBe(true);
    });
  });

  describe("Localhost", () => {
    it("should expose default geo and ip data", () => {
      expect(LOCALHOST_GEO_DATA.country).toBeDefined();
      expect(LOCALHOST_GEO_DATA.latitude).toBeDefined();
      expect(typeof LOCALHOST_IP).toBe("string");
      expect(LOCALHOST_IP.split(".").length).toBe(4);
    });
  });

  describe("Domain & Country", () => {
    it("should expose reserved slugs and sets", () => {
      expect(RESERVED_SLUGS).toContain("admin");
      expect(RESERVED_SLUGS).toContain("dashboard");
      expect(RESERVED_SLUGS).toContain("api");
      expect(SPECIAL_APEX_DOMAINS.has("vercel.app")).toBe(true);
      expect(ccTLDs.has("id")).toBe(true);
    });

    it("should expose continent constants", () => {
      expect(CONTINENTS["EU"]).toBe("Europe");
      expect(CONTINENT_CODES.includes("NA")).toBe(true);
      expect(CONTINENT_CODES.length).toBe(7);
    });
  });
});
