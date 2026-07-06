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
    // `from` is routed through formatEmailAddress (quoted + escaped display name).
    expect(payload.from).toBe('"App" <noreply@example.com>');
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
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "", pass: "" },
      },
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
    // `from` is routed through formatEmailAddress (quoted + escaped display name).
    expect(payload.from).toBe('"App" <noreply@example.com>');
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

  it("ResendProvider.send should forward scheduledAt to Resend as ISO string", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "sched-1" }, error: null });
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
    const when = new Date("2030-01-01T00:00:00.000Z");
    await provider.send({
      to: "user@example.com",
      subject: "Later",
      html: "<p>later</p>",
      scheduledAt: when,
    });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.scheduledAt).toBe(when.toISOString());
  });

  it("ResendProvider.send should set X-Priority header when priority option is provided", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "prio-1" }, error: null });
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
    await provider.send({
      to: "user@example.com",
      subject: "Urgent",
      html: "<p>urgent</p>",
      priority: 1,
    });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.headers?.["X-Priority"]).toBe("1");
  });

  it("ResendProvider.send should omit text when only html is provided (preserve auto text gen)", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "html-only" }, error: null });
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
    await provider.send({
      to: "user@example.com",
      subject: "HTML only",
      html: "<p>just html</p>",
    });
    const payload = sendMock.mock.calls[0][0];
    // text must not be force-set to "" — that would suppress Resend's auto
    // text generation from HTML. It should be absent entirely.
    expect(payload).not.toHaveProperty("text");
    expect(payload.html).toBe("<p>just html</p>");
  });

  it("ResendProvider.send should set text:'' as last resort when neither html nor text is provided", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "bare" }, error: null });
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
    await provider.send({
      to: "user@example.com",
      subject: "Bare",
    });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.text).toBe("");
  });

  it("ResendProvider.send should strip CR/LF from recipients (header injection prevention)", async () => {
    vi.resetModules();
    const sendMock = vi.fn().mockResolvedValue({ data: { id: "crlf-1" }, error: null });
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
      replyTo: "reply@example.com\r\nBcc: evil@x.com",
    });
    await provider.send({
      to: "user@example.com\r\nBcc: evil@x.com",
      cc: ["cc@example.com\r\nBcc: evil@x.com"],
      subject: "Test",
      html: "<p>Test</p>",
    });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toEqual(["user@example.comBcc: evil@x.com".replace(/\r\n/g, "")]);
    expect(payload.to[0]).not.toContain("\r");
    expect(payload.to[0]).not.toContain("\n");
    expect(payload.cc[0]).not.toContain("\r");
    expect(payload.cc[0]).not.toContain("\n");
    expect(payload.replyTo).not.toContain("\r");
    expect(payload.replyTo).not.toContain("\n");
  });

  it("NodemailerProvider.send should forward priority via priority field and X-Priority header", async () => {
    vi.resetModules();
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: "prio-smtp" });
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
    await provider.send({
      to: "user@example.com",
      subject: "Urgent",
      html: "<p>urgent</p>",
      priority: 1,
    });
    const payload = sendMailMock.mock.calls[0][0];
    // priority 1 (highest) maps to the symbolic "high" + numeric X-Priority header.
    expect(payload.priority).toBe("high");
    expect(payload.headers?.["X-Priority"]).toBe("1");
  });
});
