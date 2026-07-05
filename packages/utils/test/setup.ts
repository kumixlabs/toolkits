import { vi } from "vitest";

// Global test setup for Utils package tests
global.console = {
  ...console,
};

// Set up test environment variables
process.env.NODE_ENV = "test";

// Mock dependencies that might cause issues in tests
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
    genSalt: vi.fn().mockResolvedValue("salt"),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_jwt_token"),
    verify: vi.fn().mockReturnValue({ userId: 1, exp: Date.now() + 3600 }),
    decode: vi.fn().mockReturnValue({ userId: 1 }),
  },
}));

vi.mock("node-fetch", () => ({
  default: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "mock_data" }),
    text: () => Promise.resolve("mock_text"),
  }),
}));

// Mock MS library
vi.mock("ms", () => ({
  default: vi.fn((input: string) => {
    if (input.includes("s")) return parseInt(input) * 1000;
    if (input.includes("m")) return parseInt(input) * 1000 * 60;
    if (input.includes("h")) return parseInt(input) * 1000 * 60 * 60;
    return 1000;
  }),
}));

// Mock chrono-node
vi.mock("chrono-node", () => ({
  parse: vi.fn(),
  parseDate: vi.fn(),
}));

// Mock nanoid customAlphabet
vi.mock("nanoid", () => {
  return {
    customAlphabet: vi.fn((alphabet: string, size: number) => {
      return () => "A".repeat(size);
    }),
  };
});

// Mock cuid2 with createId and init
vi.mock("@paralleldrive/cuid2", () => {
  let counter = 0;
  return {
    createId: vi.fn(() => `mock_cuid_${++counter}`),
    init: vi.fn(({ length }: { random: () => number; length: number }) => {
      return () => "b".repeat(length);
    }),
  };
});

// Mock fetch for HTTP utilities
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true }),
  text: () => Promise.resolve("success"),
}) as any;
