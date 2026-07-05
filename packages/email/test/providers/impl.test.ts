import { beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("../../src/providers/resend");
vi.unmock("../../src/providers/nodemailer");

describe("Provider Implementations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ResendProvider constructor should throw when apiKey is missing", async () => {
    const { ResendProvider } = await import("../../src/providers/resend");
    expect(
      () =>
        new ResendProvider({
          provider: "resend",
          apiKey: "" as any,
          from: { name: "App", email: "noreply@example.com" },
        } as any),
    ).toThrow("Resend API key is required");
  });

  it("ResendProvider.validateConfig should detect invalid apiKey format", async () => {
    const { ResendProvider } = await import("../../src/providers/resend");
    const provider = new ResendProvider({
      provider: "resend",
      apiKey: "invalid_key",
      from: { name: "App", email: "noreply@example.com" },
    });
    const result = await provider.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid Resend API key format");
  });

  it("ResendProvider.validateConfig should pass with valid config", async () => {
    const { ResendProvider } = await import("../../src/providers/resend");
    const provider = new ResendProvider({
      provider: "resend",
      apiKey: "re_test_key",
      from: { name: "App", email: "noreply@example.com" },
    });
    const result = await provider.validateConfig();
    expect(result.valid).toBe(true);
  });

  it("ResendProvider.send should map options and succeed", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "mock-id" }, error: null });
    vi.doMock("resend", () => {
      function MockResend() {
        return { emails: { send: sendMock } };
      }
      return { Resend: MockResend };
    });
    const { ResendProvider } = await import("../../src/providers/resend");
    const provider = new ResendProvider({
      provider: "resend",
      apiKey: "re_test_key",
      from: { name: "App", email: "noreply@example.com" },
    });
    const result = await provider.send({
      to: ["user1@example.com", "user2@example.com"],
      cc: "manager@example.com",
      bcc: ["hidden@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
      headers: { "X-Test": "1" },
      tags: { category: "notice", priority: "high" },
      attachments: [
        {
          filename: "a.txt",
          content: Buffer.from("a"),
          contentType: "text/plain",
          cid: "cid-a",
        },
      ],
    });
    expect(result.success).toBe(true);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.from).toBe("App <noreply@example.com>");
    expect(payload.to).toEqual(["user1@example.com", "user2@example.com"]);
    expect(payload.cc).toEqual(["manager@example.com"]);
    expect(payload.bcc).toEqual(["hidden@example.com"]);
    expect(payload.html).toBe("<p>Hi</p>");
    expect(payload.text).toBe("Hi");
    expect(payload.headers).toEqual({ "X-Test": "1" });
    expect(payload.tags).toEqual([
      { name: "category", value: "notice" },
      { name: "priority", value: "high" },
    ]);
    expect(payload.attachments[0]).toEqual({
      filename: "a.txt",
      content: expect.any(Buffer),
      content_type: "text/plain",
      cid: "cid-a",
    });
  });

  it("ResendProvider.send should handle API error", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: null, error: { message: "API error" } });
    vi.doMock("resend", () => {
      function MockResend() {
        return { emails: { send: sendMock } };
      }
      return { Resend: MockResend, __sendMock: sendMock };
    });
    const { ResendProvider } = await import("../../src/providers/resend");
    const provider = new ResendProvider({
      provider: "resend",
      apiKey: "re_test_key",
      from: { name: "App", email: "noreply@example.com" },
    });
    const result = await provider.send({
      to: "user@example.com",
      subject: "Err",
      html: "<p>Err</p>",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("API error");
  });

  it("NodemailerProvider.validateConfig should detect missing host and port", async () => {
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "App", email: "noreply@example.com" },
      smtp: { host: "", port: 0, secure: false, auth: { user: "", pass: "" } },
    } as any);
    const result = await provider.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toBe("SMTP host and port are required");
  });

  it("NodemailerProvider.validateConfig should detect missing auth", async () => {
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "App", email: "noreply@example.com" },
      smtp: { host: "smtp.example.com", port: 587, secure: false, auth: { user: "", pass: "" } },
    } as any);
    const result = await provider.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toBe("SMTP authentication credentials are required");
  });

  it("NodemailerProvider.validateConfig should detect missing from", async () => {
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "", email: "" },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "user@example.com", pass: "password" },
      },
    } as any);
    const result = await provider.validateConfig();
    expect(result.valid).toBe(false);
    expect(result.error).toBe("From email and name are required");
  });

  it("NodemailerProvider.validateConfig should pass with valid config", async () => {
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "App", email: "noreply@example.com" },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "user@example.com", pass: "password" },
      },
    });
    const result = await provider.validateConfig();
    expect(result.valid).toBe(true);
  });

  it("NodemailerProvider.send should map options and succeed", async () => {
    vi.resetModules();
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: "smtp-id" });
    vi.doMock("nodemailer", () => ({
      default: {
        createTransport: vi.fn(() => ({
          sendMail: sendMailMock,
          verify: vi.fn().mockResolvedValue(true),
        })),
      },
      createTransport: vi.fn(() => ({
        sendMail: sendMailMock,
        verify: vi.fn().mockResolvedValue(true),
      })),
    }));
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "App", email: "noreply@example.com" },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "user@example.com", pass: "password" },
      },
    });
    const result = await provider.send({
      to: ["u1@example.com", "u2@example.com"],
      cc: "manager@example.com",
      bcc: ["hidden@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
      attachments: [
        {
          filename: "a.txt",
          content: Buffer.from("a"),
          contentType: "text/plain",
          cid: "cid-a",
        },
      ],
      headers: { "X-Test": "1" },
    });
    expect(result.success).toBe(true);
    const payload = sendMailMock.mock.calls[0][0];
    expect(payload.from).toBe("App <noreply@example.com>");
    expect(payload.to).toBe("u1@example.com, u2@example.com");
    expect(payload.cc).toBe("manager@example.com");
    expect(payload.bcc).toBe("hidden@example.com");
    expect(payload.html).toBe("<p>Hi</p>");
    expect(payload.text).toBe("Hi");
    expect(payload.headers).toEqual({ "X-Test": "1" });
    expect(payload.attachments[0]).toEqual({
      filename: "a.txt",
      content: expect.any(Buffer),
      contentType: "text/plain",
      cid: "cid-a",
    });
  });

  it("NodemailerProvider.send should handle SMTP error", async () => {
    vi.resetModules();
    const sendMailMock = vi.fn().mockRejectedValue(new Error("smtp failed"));
    vi.doMock("nodemailer", () => ({
      default: {
        createTransport: vi.fn(() => ({
          sendMail: sendMailMock,
          verify: vi.fn().mockResolvedValue(true),
        })),
      },
      createTransport: vi.fn(() => ({
        sendMail: sendMailMock,
        verify: vi.fn().mockResolvedValue(true),
      })),
    }));
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    const provider = new NodemailerProvider({
      provider: "nodemailer",
      from: { name: "App", email: "noreply@example.com" },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "user@example.com", pass: "password" },
      },
    });
    const result = await provider.send({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("smtp failed");
  });

  it("NodemailerProvider constructor should throw when smtp is missing", async () => {
    const { NodemailerProvider } = await import("../../src/providers/nodemailer");
    expect(
      () =>
        new NodemailerProvider({
          provider: "nodemailer",
          from: { name: "App", email: "noreply@example.com" },
        } as any),
    ).toThrow("SMTP configuration is required for Nodemailer");
  });

  it("ResendProvider.send should handle unexpected thrown error", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.doMock("resend", () => {
      function MockResend() {
        return { emails: { send: sendMock } };
      }
      return { Resend: MockResend };
    });
    const { ResendProvider } = await import("../../src/providers/resend");
    const provider = new ResendProvider({
      provider: "resend",
      apiKey: "re_test_key",
      from: { name: "App", email: "noreply@example.com" },
    });
    const result = await provider.send({
      to: "user@example.com",
      subject: "Err",
      html: "<p>Err</p>",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("network down");
  });
});
