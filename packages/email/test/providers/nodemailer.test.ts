import { beforeEach, describe, expect, it } from "vitest";

import { createNodemailer } from "../../src/index";

describe("Nodemailer Provider", () => {
  beforeEach(() => {
    delete process.env.KUMIX_EMAIL_SMTP_HOST;
    delete process.env.KUMIX_EMAIL_SMTP_PORT;
    delete process.env.KUMIX_EMAIL_SMTP_SECURE;
    delete process.env.KUMIX_EMAIL_SMTP_USER;
    delete process.env.KUMIX_EMAIL_SMTP_PASS;
    delete process.env.KUMIX_EMAIL_FROM_NAME;
    delete process.env.KUMIX_EMAIL_FROM_EMAIL;
    delete process.env.KUMIX_EMAIL_REPLY_TO;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_EMAIL;
  });

  describe("createNodemailer", () => {
    it("should create Nodemailer provider with environment variables", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const provider = createNodemailer();
      expect(provider).toBeDefined();
      expect(provider.getConfig().provider).toBe("nodemailer");
    });

    it("should create Nodemailer provider with manual config", () => {
      const config = {
        from: {
          name: "Manual App",
          email: "manual@example.com",
        },
        smtp: {
          host: "smtp.example.com",
          port: 587,
          secure: false,
          auth: {
            user: "user@example.com",
            pass: "password",
          },
        },
      };

      const provider = createNodemailer(config);
      expect(provider).toBeDefined();
      expect(provider.getConfig().provider).toBe("nodemailer");
    });

    it("should throw error when no configuration is available", () => {
      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when SMTP host is missing", () => {
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      // Missing SMTP host

      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when SMTP user is missing", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      // Missing SMTP user

      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when from name is missing", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      // Missing from name

      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables",
      );
    });

    it("should throw error when from email is missing", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      // Missing from email

      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables",
      );
    });

    it("should parse secure flag correctly", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "465";
      process.env.KUMIX_EMAIL_SMTP_SECURE = "true";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const provider = createNodemailer();
      expect(provider).toBeDefined();
      const cfg = provider.getConfig() as import("../../src/types").NodemailerConfig;
      expect(cfg.smtp.secure).toBe(true);
    });

    it("should include replyTo when set in environment", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      process.env.KUMIX_EMAIL_REPLY_TO = "reply@example.com";

      const provider = createNodemailer();
      expect(provider).toBeDefined();
      expect(provider.getConfig().replyTo).toBe("reply@example.com");
    });

    it("should prefer manual config over environment", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Env App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "env@example.com";

      const config = {
        from: {
          name: "Config App",
          email: "config@example.com",
        },
        smtp: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: "config@gmail.com",
            pass: "config-password",
          },
        },
      };

      const provider = createNodemailer(config);
      expect(provider).toBeDefined();
      const cfg = provider.getConfig() as import("../../src/types").NodemailerConfig;
      expect(cfg.smtp.host).toBe("smtp.gmail.com");
      expect(cfg.from.name).toBe("Config App");
    });
  });
});
