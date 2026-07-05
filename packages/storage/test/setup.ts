import { vi, expect } from "vitest";

// Global test setup for Storage package tests
global.console = {
  ...console,
};

// Set up test environment variables
process.env.NODE_ENV = "test";

// Mock AWS SDK for S3 tests
vi.mock("@aws-sdk/client-s3", async () => {
  const actual = await vi.importActual("@aws-sdk/client-s3");
  class S3Client {
    constructor(_: any) { }
    send = vi.fn().mockResolvedValue({});
  }
  return {
    ...actual,
    S3Client,
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    DeleteObjectsCommand: vi.fn(),
    ListObjectsV2Command: vi.fn(),
    HeadObjectCommand: vi.fn(),
    CopyObjectCommand: vi.fn(),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", async () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://example.com/presigned-url"),
}));

// Mock Cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: "https://cloudinary.com/test.jpg",
        public_id: "test-public-id",
      }),
      upload_stream: vi.fn().mockReturnValue({
        end: vi.fn(),
        on: vi.fn(),
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
      explicit: vi.fn().mockResolvedValue({
        secure_url: "https://cloudinary.com/test.jpg",
      }),
    },
    api: {
      resources: vi.fn().mockReturnValue({
        delete_resources: vi.fn().mockResolvedValue({ deleted: { "test.jpg": "deleted" } }),
      }),
    },
    search: vi.fn().mockReturnValue({
      expression: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue({
          resources: [],
          total_count: 0,
        }),
      }),
    }),
  },
}));

// Global test utilities
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeValidS3Key(): T;
    }
  }
}

expect.extend({
  toBeValidS3Key(received: string) {
    const pass = typeof received === "string" && received.length > 0 && !received.startsWith("/");
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid S3 key`
          : `expected ${received} to be a valid S3 key`,
      pass,
    };
  },
});
