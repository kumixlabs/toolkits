import { describe, expect, it } from "vitest";

import { loadS3Config, loadStorageConfig } from "../src/config";

describe("Config branch coverage", () => {
  it("loadS3Config throws on invalid provider", () => {
    expect(() =>
      loadS3Config({
        KUMIX_S3_PROVIDER: "gcp",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
      }),
    ).toThrow("Invalid S3 provider");
  });

  it("loadS3Config parses forcePathStyle from '1'", () => {
    const config = loadS3Config({
      KUMIX_S3_PROVIDER: "minio",
      KUMIX_S3_REGION: "us-east-1",
      KUMIX_S3_BUCKET: "bucket",
      KUMIX_S3_ACCESS_KEY_ID: "key",
      KUMIX_S3_SECRET_ACCESS_KEY: "secret",
      KUMIX_S3_FORCE_PATH_STYLE: "1",
    });
    expect(config.forcePathStyle).toBe(true);
  });

  it("loadCloudinaryConfig via loadStorageConfig explicit provider", () => {
    const config = loadStorageConfig({
      KUMIX_S3_PROVIDER: "cloudinary",
      KUMIX_CLOUDINARY_CLOUD_NAME: "cloud",
      KUMIX_CLOUDINARY_API_KEY: "key",
      KUMIX_CLOUDINARY_API_SECRET: "secret",
      KUMIX_CLOUDINARY_SECURE: "false",
    });
    expect(config.provider).toBe("cloudinary");
    if (config.provider === "cloudinary") {
      expect(config.secure).toBe(false);
    }
  });

  it("loadStorageConfig auto-detect throws when only partial cloudinary vars", () => {
    expect(() =>
      loadStorageConfig({
        KUMIX_CLOUDINARY_CLOUD_NAME: "cloud",
      }),
    ).toThrow("No storage configuration found");
  });

  it("loadStorageConfig auto-detects S3 with default provider when KUMIX_S3_PROVIDER unset", () => {
    const config = loadStorageConfig({
      KUMIX_S3_REGION: "us-east-1",
      KUMIX_S3_BUCKET: "bucket",
      KUMIX_S3_ACCESS_KEY_ID: "key",
      KUMIX_S3_SECRET_ACCESS_KEY: "secret",
    });
    expect(config.provider).toBe("aws");
    if (config.provider !== "cloudflare-r2" && config.provider !== "cloudinary") {
      expect(config.bucket).toBe("bucket");
    }
  });
});
