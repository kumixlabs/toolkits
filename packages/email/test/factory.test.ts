import { beforeEach, describe, expect, it } from "vitest";

import type { NodemailerConfig, ResendConfig } from "../src/index";
import {
  createEmail,
  createNodemailer,
  createResend,
  getConfiguredProvider,
  isEmailConfigured,
} from "../src/index";

describe("Email Factory", () => {
  beforeEach(() => {
    delete process.env.KUMIX_EMAIL_RESEND_API_KEY;
    delete process.env.KUMIX_EMAIL_FROM_NAME;
    delete process.env.KUMIX_EMAIL_FROM_EMAIL;
    delete process.env.KUMIX_EMAIL_REPLY_TO;
    delete process.env.KUMIX_EMAIL_SMTP_HOST;
    delete process.env.KUMIX_EMAIL_SMTP_PORT;
    delete process.env.KUMIX_EMAIL_SMTP_SECURE;
    delete process.env.KUMIX_EMAIL_SMTP_USER;
    delete process.env.KUMIX_EMAIL_SMTP_PASS;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_EMAIL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it("should have factory functions exported", () => {
    expect(typeof createEmail).toBe("function");
    expect(typeof createResend).toBe("function");
    expect(typeof createNodemailer).toBe("function");
    expect(typeof isEmailConfigured).toBe("function");
    expect(typeof getConfiguredProvider).toBe("function");
  });

  describe("isEmailConfigured", () => {
    it("should return false when no provider is configured", () => {
      expect(isEmailConfigured()).toBe(false);
    });

    it("should return true when Resend is configured", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      expect(isEmailConfigured()).toBe(true);
    });

    it("should return true when Nodemailer is configured", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      expect(isEmailConfigured()).toBe(true);
    });
  });

  describe("getConfiguredProvider", () => {
    it("should return null when no provider is configured", () => {
      expect(getConfiguredProvider()).toBeNull();
    });

    it("should return resend when Resend is configured", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      expect(getConfiguredProvider()).toBe("resend");
    });

    it("should return nodemailer when Nodemailer is configured", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      expect(getConfiguredProvider()).toBe("nodemailer");
    });

    it("should prefer Resend over Nodemailer when both are configured", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";

      expect(getConfiguredProvider()).toBe("resend");
    });
  });

  describe("createEmail", () => {
    it("should create EmailService with Resend config", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const emailService = createEmail();
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("resend");
    });

    it("should create EmailService with Nodemailer config", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const emailService = createEmail();
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("nodemailer");
    });

    it("should throw error when no config available", () => {
      expect(() => createEmail()).toThrow(
        "No email configuration provided and none found in environment variables",
      );
    });
  });

  describe("createResend", () => {
    it("should create EmailService with Resend config", () => {
      const config: ResendConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = createResend(config);
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("resend");
    });

    it("should create EmailService from environment variables", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const emailService = createResend();
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("resend");
    });

    it("should throw error when no Resend config is found", () => {
      expect(() => createResend()).toThrow(
        "No Resend configuration found. Please provide config or set environment variables: " +
          "KUMIX_EMAIL_RESEND_API_KEY, KUMIX_EMAIL_FROM_NAME, KUMIX_EMAIL_FROM_EMAIL",
      );
    });

    it("should create from explicit EnvRecord", () => {
      const env = {
        KUMIX_EMAIL_RESEND_API_KEY: "re_test_key",
        KUMIX_EMAIL_FROM_NAME: "Test App",
        KUMIX_EMAIL_FROM_EMAIL: "test@example.com",
      };
      const emailService = createResend(undefined, env);
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("resend");
    });
  });

  describe("createNodemailer", () => {
    it("should create EmailService with Nodemailer config", () => {
      const config: NodemailerConfig = {
        provider: "nodemailer",
        from: {
          name: "Test App",
          email: "test@example.com",
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

      const emailService = createNodemailer(config);
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("nodemailer");
    });

    it("should create EmailService from environment variables", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";

      const emailService = createNodemailer();
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("nodemailer");
    });

    it("should throw error when no Nodemailer config is found", () => {
      expect(() => createNodemailer()).toThrow(
        "No Nodemailer configuration found. Please provide config or set environment variables: " +
          "KUMIX_EMAIL_SMTP_HOST, KUMIX_EMAIL_SMTP_PORT, KUMIX_EMAIL_SMTP_USER, KUMIX_EMAIL_SMTP_PASS, KUMIX_EMAIL_FROM_NAME, KUMIX_EMAIL_FROM_EMAIL",
      );
    });

    it("should create from explicit EnvRecord", () => {
      const env = {
        KUMIX_EMAIL_SMTP_HOST: "smtp.example.com",
        KUMIX_EMAIL_SMTP_PORT: "587",
        KUMIX_EMAIL_SMTP_USER: "user@example.com",
        KUMIX_EMAIL_SMTP_PASS: "password",
        KUMIX_EMAIL_FROM_NAME: "Test App",
        KUMIX_EMAIL_FROM_EMAIL: "test@example.com",
      };
      const emailService = createNodemailer(undefined, env);
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("nodemailer");
    });
  });

  describe("createEmail with explicit EnvRecord", () => {
    it("should create EmailService from explicit env", () => {
      const env = {
        KUMIX_EMAIL_RESEND_API_KEY: "re_test_key",
        KUMIX_EMAIL_FROM_NAME: "Test App",
        KUMIX_EMAIL_FROM_EMAIL: "test@example.com",
      };
      const emailService = createEmail(undefined, env);
      expect(emailService).toBeDefined();
      expect(emailService.getConfig().provider).toBe("resend");
    });
  });
});
