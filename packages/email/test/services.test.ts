import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmailConfig } from "../src/index";
import { EmailService } from "../src/index";

describe("EmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create EmailService with Resend provider", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      expect(emailService).toBeInstanceOf(EmailService);
      expect(emailService.getConfig()).toEqual(config);
    });

    it("should create EmailService with Nodemailer provider", () => {
      const config: EmailConfig = {
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

      const emailService = new EmailService(config);

      expect(emailService).toBeInstanceOf(EmailService);
      expect(emailService.getConfig()).toEqual(config);
    });

    it("should throw error for unsupported provider", () => {
      const config = {
        provider: "unsupported",
        from: {
          name: "Test",
          email: "test@example.com",
        },
      } as any;

      expect(() => new EmailService(config)).toThrow("Unsupported email provider: unsupported");
    });
  });

  describe("updateConfig", () => {
    it("should have updateConfig method", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      // Test that the method exists
      expect(typeof emailService.updateConfig).toBe("function");
    });
  });

  describe("validateConfig", () => {
    it("should have validateConfig method", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      // Test that the method exists
      expect(typeof emailService.validateConfig).toBe("function");
    });

    it("should return validation result", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      // Call the method to check it returns something
      const result = emailService.validateConfig();
      expect(typeof result).toBe("object");
    });
  });

  describe("Provider Integration", () => {
    it("should work with different providers", () => {
      const resendConfig: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const nodemailerConfig: EmailConfig = {
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

      const resendService = new EmailService(resendConfig);
      const nodemailerService = new EmailService(nodemailerConfig);

      expect(resendService).toBeInstanceOf(EmailService);
      expect(nodemailerService).toBeInstanceOf(EmailService);
      expect(resendService.getConfig().provider).toBe("resend");
      expect(nodemailerService.getConfig().provider).toBe("nodemailer");
    });
  });

  describe("Methods Existence", () => {
    it("should have all required methods", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      expect(typeof emailService.sendEmail).toBe("function");
      expect(typeof emailService.sendTemplate).toBe("function");
      expect(typeof emailService.validateConfig).toBe("function");
      expect(typeof emailService.updateConfig).toBe("function");
      expect(typeof emailService.getConfig).toBe("function");
    });
  });

  describe("sendEmail", () => {
    it("should send email successfully with Resend provider", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);
      const options = {
        to: "recipient@example.com",
        subject: "Test Email",
        html: "<h1>Hello World</h1>",
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
    });

    it("should send email successfully with Nodemailer provider", async () => {
      const config: EmailConfig = {
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

      const emailService = new EmailService(config);
      const options = {
        to: "recipient@example.com",
        subject: "Test Email",
        html: "<h1>Hello World</h1>",
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
    });

    it("should handle email with attachments", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);
      const options = {
        to: "recipient@example.com",
        subject: "Email with attachment",
        html: "<p>See attached file</p>",
        attachments: [
          {
            filename: "test.txt",
            content: Buffer.from("test content"),
            contentType: "text/plain",
          },
        ],
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
    });

    it("should handle email with multiple recipients", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);
      const options = {
        to: ["user1@example.com", "user2@example.com"],
        cc: "manager@example.com",
        bcc: "admin@example.com",
        subject: "Group Email",
        html: "<p>Hello team</p>",
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
    });
  });

  describe("sendTemplate", () => {
    it("should send template email successfully", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      const TestComponent = ({ name }: { name: string }) =>
        React.createElement("div", null, `Hello ${name}!`);

      const result = await emailService.sendTemplate(
        TestComponent,
        { name: "John" },
        {
          to: "recipient@example.com",
          subject: "Template Test",
        },
      );

      expect(result.success).toBe(true);
    });

    it("should handle template with props", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      const TestComponent = ({ name, message }: { name: string; message: string }) =>
        React.createElement("div", null, `Hello ${name}! ${message}`);

      const result = await emailService.sendTemplate(
        TestComponent,
        { name: "John", message: "Welcome to our app" },
        {
          to: "recipient@example.com",
          subject: "Welcome Template",
        },
      );

      expect(result.success).toBe(true);
    });

    it("should return error when template rendering fails", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      const TestComponent = ({ name }: { name: string }) =>
        React.createElement("div", null, `Hello ${name}!`);

      const components = await import("react-email");
      // Arrange: force render to throw
      (components.render as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("render failed");
      });

      // Act
      const result = await emailService.sendTemplate(
        TestComponent,
        { name: "John" },
        {
          to: "recipient@example.com",
          subject: "Template Test",
        },
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("render failed");
    });
  });

  describe("validateConfig default branch", () => {
    it("should return valid when provider has no validateConfig", async () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };
      const emailService = new EmailService(config);
      (emailService as any).provider = {
        send: vi.fn(),
      };
      const result = await emailService.validateConfig();
      expect(result).toEqual({ valid: true });
    });
  });
  describe("updateConfig", () => {
    it("should update configuration successfully", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      const newConfig: EmailConfig = {
        provider: "nodemailer",
        from: {
          name: "Updated App",
          email: "updated@example.com",
        },
        smtp: {
          host: "smtp.newprovider.com",
          port: 587,
          secure: false,
          auth: {
            user: "user@newprovider.com",
            pass: "newpassword",
          },
        },
      };

      emailService.updateConfig(newConfig);

      expect(emailService.getConfig()).toEqual(newConfig);
    });

    it("should throw error when updating with unsupported provider", () => {
      const config: EmailConfig = {
        provider: "resend",
        apiKey: "re_test_key",
        from: {
          name: "Test App",
          email: "test@example.com",
        },
      };

      const emailService = new EmailService(config);

      expect(() => {
        emailService.updateConfig({
          provider: "unsupported",
          from: { name: "Test", email: "test@example.com" },
        } as any);
      }).toThrow("Unsupported email provider: unsupported");
    });
  });
});
