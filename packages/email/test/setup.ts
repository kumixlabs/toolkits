import { afterEach, vi } from "vitest";

process.env.NODE_ENV = "test";

function createMockResend() {
  function MockResend() {
    return {
      emails: {
        send: vi.fn().mockResolvedValue({
          data: { id: "test-email-id" },
          error: null,
        }),
      },
    };
  }
  return MockResend;
}

vi.mock("resend", () => ({
  Resend: createMockResend(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({
        messageId: "test-message-id",
        envelope: { from: "test@example.com", to: ["recipient@example.com"] },
      }),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({
      messageId: "test-message-id",
      envelope: { from: "test@example.com", to: ["recipient@example.com"] },
    }),
    verify: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("react-email", () => ({
  render: vi.fn(() => Promise.resolve("<html>mock-rendered-template</html>")),
}));

function createMockResendProvider() {
  function MockResendProvider(config: any) {
    return {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: "resend-test-message-id",
        provider: "resend",
      }),
      validateConfig: vi.fn().mockResolvedValue({ valid: true }),
      getConfig: vi.fn().mockReturnValue({
        provider: "resend",
        apiKey: config?.apiKey || "test-api-key",
        from: config?.from || { name: "Test", email: "test@example.com" },
      }),
    };
  }
  return MockResendProvider;
}

function createMockNodemailerProvider() {
  function MockNodemailerProvider(config: any) {
    return {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: "nodemailer-test-message-id",
        provider: "nodemailer",
      }),
      validateConfig: vi.fn().mockResolvedValue({ valid: true }),
      getConfig: vi.fn().mockReturnValue({
        provider: "nodemailer",
        smtp: config?.smtp || { host: "localhost", port: 587 },
        from: config?.from || { name: "Test", email: "test@example.com" },
      }),
    };
  }
  return MockNodemailerProvider;
}

vi.mock("../src/providers/resend", () => ({
  ResendProvider: createMockResendProvider(),
}));

vi.mock("../src/providers/nodemailer", () => ({
  NodemailerProvider: createMockNodemailerProvider(),
}));

afterEach(() => {
  vi.clearAllMocks();
});