import { beforeEach, describe, expect, it } from "vitest";

import { ENV_VARS, getStorageEnvVars, getStorageProvider } from "../src/config";

describe("Storage Config Utilities", () => {
  beforeEach(() => {
    const keys = Object.values(ENV_VARS) as string[];
    keys.forEach((key) => {
      delete (process.env as any)[key];
    });
  });

  it("getStorageProvider returns undefined when not configured", () => {
    expect(getStorageProvider()).toBeUndefined();
  });

  it("getStorageProvider autodetects providers", () => {
    process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "cloud";
    expect(getStorageProvider()).toBe("cloudinary");
    delete process.env.KUMIX_CLOUDINARY_CLOUD_NAME;
    process.env.KUMIX_S3_BUCKET = "bucket";
    expect(getStorageProvider()).toBe("aws");
  });

  it("getStorageProvider respects explicit provider", () => {
    process.env.KUMIX_S3_PROVIDER = "cloudflare-r2";
    expect(getStorageProvider()).toBe("cloudflare-r2");
  });

  it("getStorageEnvVars masks secrets and returns set vars", () => {
    process.env.KUMIX_S3_PROVIDER = "aws";
    process.env.KUMIX_S3_REGION = "us-east-1";
    process.env.KUMIX_S3_BUCKET = "my-bucket";
    process.env.KUMIX_S3_ACCESS_KEY_ID = "AKIA12345678";
    process.env.KUMIX_S3_SECRET_ACCESS_KEY = "secretkeyvalue";
    process.env.KUMIX_CLOUDINARY_API_KEY = "cloudkey123";
    const vars = getStorageEnvVars();
    expect(vars.KUMIX_S3_PROVIDER).toBe("aws");
    // Non-sensitive values stay in plaintext.
    expect(vars.KUMIX_S3_REGION).toBe("us-east-1");
    expect(vars.KUMIX_S3_BUCKET).toBe("my-bucket");
    // Sensitive values are fully masked to "****" (previously leaked plaintext
    // for ACCESS_KEY_ID / API_KEY, and only partially masked SECRET_ACCESS_KEY).
    expect(vars.KUMIX_S3_ACCESS_KEY_ID).toBe("****");
    expect(vars.KUMIX_S3_SECRET_ACCESS_KEY).toBe("****");
    expect(vars.KUMIX_CLOUDINARY_API_KEY).toBe("****");
  });
});
