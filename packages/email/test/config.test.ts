import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NodemailerConfig, ResendConfig } from "../src/types";
import {
  getEmailEnvVars,
  hasEmailConfig,
  loadEmailConfig,
  loadNodemailerConfig,
  loadResendConfig,
  validateEmailEnvVars,
  validateNodemailerEnvVars,
  validateResendEnvVars,
} from "../src/index";

function resendEnv() {
  return {
    KUMIX_EMAIL_RESEND_API_KEY: "re_test_key",
    KUMIX_EMAIL_FROM_NAME: "Test App",
    KUMIX_EMAIL_FROM_EMAIL: "test@example.com",
  };
}

function nodemailerEnv() {
  return {
    KUMIX_EMAIL_SMTP_HOST: "smtp.example.com",
    KUMIX_EMAIL_SMTP_PORT: "587",
    KUMIX_EMAIL_SMTP_USER: "user@example.com",
    KUMIX_EMAIL_SMTP_PASS: "password",
    KUMIX_EMAIL_FROM_NAME: "Test App",
    KUMIX_EMAIL_FROM_EMAIL: "sender@example.com",
  };
}

describe("Email Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  // =============================================================================
  // EnvRecord (explicit env parameter)
  // =============================================================================

  describe("EnvRecord (explicit env parameter)", () => {
    describe("loadResendConfig", () => {
      it("should load from explicit EnvRecord", () => {
        const config = loadResendConfig(resendEnv());
        expect(config).not.toBeNull();
        expect(config!.provider).toBe("resend");
        expect((config as ResendConfig).apiKey).toBe("re_test_key");
      });

      it("should return null when explicit env has no api key", () => {
        const config = loadResendConfig({ KUMIX_EMAIL_FROM_NAME: "A", KUMIX_EMAIL_FROM_EMAIL: "a@b.com" });
        expect(config).toBeNull();
      });

      it("should return null for empty explicit env", () => {
        const config = loadResendConfig({});
        expect(config).toBeNull();
      });
    });

    describe("loadNodemailerConfig", () => {
      it("should load from explicit EnvRecord", () => {
        const config = loadNodemailerConfig(nodemailerEnv());
        expect(config).not.toBeNull();
        expect(config!.provider).toBe("nodemailer");
        expect((config as NodemailerConfig).smtp.host).toBe("smtp.example.com");
      });

      it("should return null when required fields missing", () => {
        const config = loadNodemailerConfig({ KUMIX_EMAIL_SMTP_HOST: "h" });
        expect(config).toBeNull();
      });
    });

    describe("loadEmailConfig", () => {
      it("should auto-detect from explicit EnvRecord", () => {
        const config = loadEmailConfig(resendEnv());
        expect(config?.provider).toBe("resend");
      });

      it("should return null for empty explicit env", () => {
        expect(loadEmailConfig({})).toBeNull();
      });
    });

    describe("hasEmailConfig", () => {
      it("should return true when explicit env has Resend", () => {
        expect(hasEmailConfig(resendEnv())).toBe(true);
      });

      it("should return true when explicit env has Nodemailer", () => {
        expect(hasEmailConfig(nodemailerEnv())).toBe(true);
      });

      it("should return false for empty explicit env", () => {
        expect(hasEmailConfig({})).toBe(false);
      });
    });

    describe("getEmailEnvVars", () => {
      it("should return masked values from explicit env", () => {
        const vars = getEmailEnvVars({ KUMIX_EMAIL_RESEND_API_KEY: "secret", KUMIX_EMAIL_FROM_EMAIL: "a@b.com" });
        expect(vars.KUMIX_EMAIL_RESEND_API_KEY).toBe("***");
        expect(vars.KUMIX_EMAIL_FROM_EMAIL).toBe("a@b.com");
      });

      it("should return empty object when no env available", () => {
        const vars = getEmailEnvVars();
        expect(vars.KUMIX_EMAIL_FROM_EMAIL).toBeUndefined();
      });
    });
  });

  // =============================================================================
  // loadEmailConfig
  // =============================================================================

  describe("loadEmailConfig", () => {
    it("should load Resend configuration when available", () => {
      Object.assign(process.env, resendEnv());
      const config = loadEmailConfig();
      expect(config).toBeTruthy();
      expect(config?.provider).toBe("resend");
      expect((config as ResendConfig).apiKey).toBe("re_test_key");
      expect(config!.from.name).toBe("Test App");
      expect(config!.from.email).toBe("test@example.com");
    });

    it("should load Nodemailer configuration when Resend is not available", () => {
      Object.assign(process.env, nodemailerEnv());
      const config = loadEmailConfig();
      expect(config).toBeTruthy();
      expect(config?.provider).toBe("nodemailer");
      expect((config as NodemailerConfig).smtp.host).toBe("smtp.example.com");
      expect((config as NodemailerConfig).smtp.port).toBe(587);
    });

    it("should return null when no provider is configured", () => {
      expect(loadEmailConfig()).toBeNull();
    });

    it("should prefer Resend over Nodemailer when both are configured", () => {
      Object.assign(process.env, resendEnv());
      Object.assign(process.env, nodemailerEnv());
      expect(loadEmailConfig()?.provider).toBe("resend");
    });
  });

  // =============================================================================
  // loadResendConfig
  // =============================================================================

  describe("loadResendConfig", () => {
    it("should load Resend configuration", () => {
      Object.assign(process.env, resendEnv());
      const config = loadResendConfig();
      expect(config).toBeTruthy();
      expect(config?.provider).toBe("resend");
      expect((config as ResendConfig).apiKey).toBe("re_test_key");
      expect(config!.from.email).toBe("test@example.com");
    });

    it("should return null when API key is missing", () => {
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      expect(loadResendConfig()).toBeNull();
    });

    it("should return null when from name is missing", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      expect(loadResendConfig()).toBeNull();
    });

    it("should return null when from email is missing", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      expect(loadResendConfig()).toBeNull();
    });

    it("should include replyTo when set", () => {
      Object.assign(process.env, { ...resendEnv(), KUMIX_EMAIL_REPLY_TO: "reply@example.com" });
      expect(loadResendConfig()?.replyTo).toBe("reply@example.com");
    });
  });

  // =============================================================================
  // loadNodemailerConfig
  // =============================================================================

  describe("loadNodemailerConfig", () => {
    it("should load with all settings including secure=true", () => {
      Object.assign(process.env, {
        ...nodemailerEnv(),
        KUMIX_EMAIL_SMTP_PORT: "465",
        KUMIX_EMAIL_SMTP_SECURE: "true",
        KUMIX_EMAIL_REPLY_TO: "reply@example.com",
      });
      const config = loadNodemailerConfig() as NodemailerConfig | null;
      expect(config).toBeTruthy();
      expect(config?.smtp.host).toBe("smtp.example.com");
      expect(config?.smtp.port).toBe(465);
      expect(config?.smtp.secure).toBe(true);
      expect(config?.smtp.auth.user).toBe("user@example.com");
      expect(config?.replyTo).toBe("reply@example.com");
    });

    it("should treat secure=false correctly", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_SECURE: "false" });
      expect((loadNodemailerConfig() as NodemailerConfig).smtp.secure).toBe(false);
    });

    it("should treat missing secure as false", () => {
      Object.assign(process.env, nodemailerEnv());
      expect((loadNodemailerConfig() as NodemailerConfig).smtp.secure).toBe(false);
    });

    it("should return null when required settings are missing", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "Test App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "sender@example.com";
      expect(loadNodemailerConfig()).toBeNull();
    });

    it("should return null when from name is missing", () => {
      process.env.KUMIX_EMAIL_SMTP_HOST = "smtp.example.com";
      process.env.KUMIX_EMAIL_SMTP_PORT = "587";
      process.env.KUMIX_EMAIL_SMTP_USER = "user@example.com";
      process.env.KUMIX_EMAIL_SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "sender@example.com";
      expect(loadNodemailerConfig()).toBeNull();
    });

    it("should parse port numbers correctly", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "465", KUMIX_EMAIL_SMTP_SECURE: "true" });
      const cfg = loadNodemailerConfig() as NodemailerConfig | null;
      expect(cfg?.smtp.port).toBe(465);
      expect(cfg?.smtp.secure).toBe(true);
    });
  });

  // =============================================================================
  // validateResendEnvVars
  // =============================================================================

  describe("validateResendEnvVars", () => {
    it("should pass with KUMIX_EMAIL_* vars", () => {
      Object.assign(process.env, resendEnv());
      const result = validateResendEnvVars();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should pass with legacy fallback vars", () => {
      process.env.RESEND_API_KEY = "re_key";
      process.env.EMAIL_FROM_NAME = "App";
      process.env.EMAIL_FROM_EMAIL = "app@example.com";
      const result = validateResendEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should pass with mixed KUMIX_ and legacy vars", () => {
      process.env.RESEND_API_KEY = "re_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "app@example.com";
      const result = validateResendEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should fail when API key is missing", () => {
      process.env.KUMIX_EMAIL_FROM_NAME = "App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "app@example.com";
      const result = validateResendEnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("KUMIX_EMAIL_RESEND_API_KEY or RESEND_API_KEY");
    });

    it("should fail when from name is missing", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_key";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "app@example.com";
      const result = validateResendEnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("KUMIX_EMAIL_FROM_NAME or EMAIL_FROM_NAME");
    });

    it("should fail when from email is missing", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_key";
      process.env.KUMIX_EMAIL_FROM_NAME = "App";
      const result = validateResendEnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("KUMIX_EMAIL_FROM_EMAIL or EMAIL_FROM_EMAIL");
    });

    it("should accept explicit EnvRecord", () => {
      const result = validateResendEnvVars(resendEnv());
      expect(result.valid).toBe(true);
    });

    it("should accept explicit EnvRecord with legacy fallback vars", () => {
      const result = validateResendEnvVars({
        RESEND_API_KEY: "re_key",
        KUMIX_EMAIL_FROM_NAME: "App",
        KUMIX_EMAIL_FROM_EMAIL: "app@example.com",
      });
      expect(result.valid).toBe(true);
    });
  });

  // =============================================================================
  // validateNodemailerEnvVars
  // =============================================================================

  describe("validateNodemailerEnvVars", () => {
    it("should pass with all required vars", () => {
      Object.assign(process.env, nodemailerEnv());
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should pass with legacy fallback SMTP vars", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASS = "password";
      process.env.KUMIX_EMAIL_FROM_NAME = "App";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "app@example.com";
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should fail when port is too high (70000)", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "70000" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SMTP_PORT must be a valid port number (1-65535)");
    });

    it("should fail when port is 0", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "0" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SMTP_PORT must be a valid port number (1-65535)");
    });

    it("should fail when port is negative", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "-1" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(false);
    });

    it("should fail when port is non-numeric", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "abc" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(false);
    });

    it("should accept port 1", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "1" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should accept port 65535", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "65535" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(true);
    });

    it("should fail when port is 65536", () => {
      Object.assign(process.env, { ...nodemailerEnv(), KUMIX_EMAIL_SMTP_PORT: "65536" });
      const result = validateNodemailerEnvVars();
      expect(result.valid).toBe(false);
    });

    it("should accept explicit EnvRecord", () => {
      const result = validateNodemailerEnvVars(nodemailerEnv());
      expect(result.valid).toBe(true);
    });

    it("should accept explicit EnvRecord with fallback vars", () => {
      const result = validateNodemailerEnvVars({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_USER: "user@example.com",
        SMTP_PASS: "password",
        EMAIL_FROM_NAME: "App",
        EMAIL_FROM_EMAIL: "app@example.com",
      });
      expect(result.valid).toBe(true);
    });
  });

  // =============================================================================
  // validateEmailEnvVars
  // =============================================================================

  describe("validateEmailEnvVars", () => {
    it("should validate Resend configuration", () => {
      Object.assign(process.env, resendEnv());
      const result = validateEmailEnvVars();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate Nodemailer configuration", () => {
      Object.assign(process.env, nodemailerEnv());
      const result = validateEmailEnvVars();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for missing required variables", () => {
      const result = validateEmailEnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it("should accept explicit EnvRecord", () => {
      const result = validateEmailEnvVars(resendEnv());
      expect(result.valid).toBe(true);
    });
  });

  // =============================================================================
  // getEmailEnvVars
  // =============================================================================

  describe("getEmailEnvVars", () => {
    it("should return masked environment variables", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_secret_key_123456";
      process.env.KUMIX_EMAIL_SMTP_PASS = "secret_password";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      const envVars = getEmailEnvVars();
      expect(envVars.KUMIX_EMAIL_RESEND_API_KEY).toBe("***");
      expect(envVars.KUMIX_EMAIL_SMTP_PASS).toBe("***");
      expect(envVars.KUMIX_EMAIL_FROM_EMAIL).toBe("test@example.com");
    });

    it("should handle missing variables", () => {
      const envVars = getEmailEnvVars();
      expect(envVars.KUMIX_EMAIL_RESEND_API_KEY).toBeUndefined();
      expect(envVars.KUMIX_EMAIL_SMTP_PASS).toBeUndefined();
    });
  });

  // =============================================================================
  // hasEmailConfig
  // =============================================================================

  describe("hasEmailConfig", () => {
    it("should return true when Resend is configured", () => {
      Object.assign(process.env, resendEnv());
      expect(hasEmailConfig()).toBe(true);
    });

    it("should return true when Nodemailer is configured", () => {
      Object.assign(process.env, nodemailerEnv());
      expect(hasEmailConfig()).toBe(true);
    });

    it("should return false when no provider is configured", () => {
      expect(hasEmailConfig()).toBe(false);
    });

    it("should return false when configuration is incomplete", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "re_test_key";
      expect(hasEmailConfig()).toBe(false);
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe("Edge Cases", () => {
    it("should handle empty string environment variables", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "";
      process.env.KUMIX_EMAIL_FROM_NAME = "";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "";
      expect(loadEmailConfig()).toBeNull();
    });

    it("should handle whitespace-only environment variables", () => {
      process.env.KUMIX_EMAIL_RESEND_API_KEY = "   ";
      process.env.KUMIX_EMAIL_FROM_NAME = "   ";
      process.env.KUMIX_EMAIL_FROM_EMAIL = "test@example.com";
      const config = loadEmailConfig();
      expect(config).toBeTruthy();
      expect(config?.provider).toBe("resend");
      expect((config as ResendConfig).apiKey).toBe("   ");
    });
  });
});