import { beforeEach, describe, expect, it } from "vitest";

import { createResend } from "../../src/index";

describe("Resend Provider", () => {
  beforeEach(() => {
    delete process.env.KUMIX_EMAIL_RESEND_API_KEY;
    delete process.env.KUMIX_EMAIL_FROM_NAME;
    delete process.env.KUMIX_EMAIL_FROM_EMAIL;
    delete process.env.KUMIX_EMAIL_REPLY_TO;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_EMAIL;
  });

  describe("createResend", () => {
    it("should create Resend provider with environment variables", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const provider = createResend();
      expect(provider).toBeDefined();
      expect(provider.getConfig().provider).toBe("resend");
    });

    it("should create Resend provider with manual config", () => {
      const config = {
        apiKey: "re_manual_key",
        from: {
          name: "Manual App",
          email: "manual@example.com",
        },
      };

      const provider = createResend(config);
      expect(provider).toBeDefined();
      const cfg = provider.getConfig() as import("../../src/types").ResendConfig;
      expect(cfg.provider).toBe("resend");
    });

    it("should throw error when no configuration is available", () => {
      expect(() => createResend()).toThrow(
        "No Resend configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when API key is missing in environment", () => {
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      // Missing API key

      expect(() => createResend()).toThrow(
        "No Resend configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when from name is missing in environment", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      // Missing from name

      expect(() => createResend()).toThrow(
        "No Resend configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when from email is missing in environment", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      // Missing from email

      expect(() => createResend()).toThrow(
        "No Resend configuration found. Please provide config or set environment variables",
      );
    });

    it("should include replyTo when set in environment", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      process.env.KUMIX_EMAIL_REPLY_TO = "reply@example.com";

      const provider = createResend();
      expect(provider).toBeDefined();
      expect(provider.getConfig().replyTo).toBe("reply@example.com");
    });

    it("should prefer manual config over environment", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_env_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Env App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "env@example.com";

      const config = {
        apiKey: "re_config_key",
        from: {
          name: "Config App",
          email: "config@example.com",
        },
      };

      const provider = createResend(config);
      expect(provider).toBeDefined();
      const cfg = provider.getConfig() as import("../../src/types").ResendConfig;
      expect(cfg.apiKey).toBe("re_config_key");
      expect(cfg.from.name).toBe("Config App");
    });
  });
});
