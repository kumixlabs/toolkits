import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getStorageEnvVars,
  getStorageProvider,
  hasStorageConfig,
  isStorageConfigured,
  loadCloudinaryConfig,
  loadS3Config,
  loadStorageConfig,
  validateCloudinaryEnvVars,
  validateS3EnvVars,
} from "../src/config";

describe("Storage Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all environment variables
    delete process.env.KUMIX_S3_PROVIDER;
    delete process.env.KUMIX_S3_REGION;
    delete process.env.KUMIX_S3_BUCKET;
    delete process.env.KUMIX_S3_ACCESS_KEY_ID;
    delete process.env.KUMIX_S3_SECRET_ACCESS_KEY;
    delete process.env.KUMIX_S3_ENDPOINT;
    delete process.env.KUMIX_S3_FORCE_PATH_STYLE;
    delete process.env.KUMIX_S3_PUBLIC_URL;
    delete process.env.KUMIX_CLOUDINARY_CLOUD_NAME;
    delete process.env.KUMIX_CLOUDINARY_API_KEY;
    delete process.env.KUMIX_CLOUDINARY_API_SECRET;
    delete process.env.KUMIX_CLOUDINARY_SECURE;
    delete process.env.KUMIX_CLOUDINARY_FOLDER;
  });

  describe("loadStorageConfig", () => {
    it("should load S3 configuration when available", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";

      const config = loadStorageConfig();

      expect(config.provider).toBe("aws");
      if (config.provider === "aws") {
        expect(config.accessKeyId).toBe("test-key");
        expect(config.secretAccessKey).toBe("test-secret");
        expect(config.region).toBe("us-east-1");
        expect(config.bucket).toBe("test-bucket");
      }
    });

    it("should load Cloudinary configuration when available", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "test-key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "test-secret";

      const config = loadStorageConfig();

      expect(config.provider).toBe("cloudinary");
      if (config.provider === "cloudinary") {
        expect(config.cloudName).toBe("test-cloud");
        expect(config.apiKey).toBe("test-key");
        expect(config.apiSecret).toBe("test-secret");
      }
    });

    it("should respect KUMIX_S3_PROVIDER environment variable", () => {
      // Set both providers
      process.env.KUMIX_S3_PROVIDER = "cloudinary";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "test-key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "test-secret";

      const config = loadStorageConfig();

      expect(config.provider).toBe("cloudinary");
    });

    it("should throw error when no provider is configured", () => {
      expect(() => loadStorageConfig()).toThrow("No storage configuration found");
    });

    it("should prefer S3 over Cloudinary when both are available", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "test-key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "test-secret";

      const config = loadStorageConfig();

      expect(config.provider).toBe("aws");
    });

    it("should load custom S3 endpoint", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";
      process.env.KUMIX_S3_ENDPOINT = "https://custom.s3.endpoint.com";

      const config = loadStorageConfig();

      if (config.provider === "aws") {
        expect(config.endpoint).toBe("https://custom.s3.endpoint.com");
      }
    });

    it("should load S3 force path style", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";
      process.env.KUMIX_S3_FORCE_PATH_STYLE = "true";

      const config = loadStorageConfig();

      if (config.provider === "aws") {
        expect(config.forcePathStyle).toBe(true);
      }
    });
  });

  describe("loadS3Config", () => {
    it("should load S3 configuration with all required fields", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-west-2";
      process.env.KUMIX_S3_BUCKET = "my-bucket";
      process.env.KUMIX_S3_ENDPOINT = "https://s3.us-west-2.amazonaws.com";

      const config = loadS3Config();

      expect(config.provider).toBe("aws");
      expect(config.accessKeyId).toBe("test-key");
      expect(config.secretAccessKey).toBe("test-secret");
      expect(config.region).toBe("us-west-2");
      expect(config.bucket).toBe("my-bucket");
      expect(config.endpoint).toBe("https://s3.us-west-2.amazonaws.com");
    });

    it("should use default values for optional fields", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";

      const config = loadS3Config();

      expect(config.endpoint).toBeUndefined();
      expect(config.forcePathStyle).toBe(false);
    });

    it("should throw error when required fields are missing", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      // Missing other required fields

      expect(() => loadS3Config()).toThrow(
        "Missing required environment variable: KUMIX_S3_REGION",
      );
    });

    it("should parse forcePathStyle correctly", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";
      process.env.KUMIX_S3_FORCE_PATH_STYLE = "false";

      const config = loadS3Config();

      expect(config.forcePathStyle).toBe(false);
    });
  });

  describe("loadCloudinaryConfig", () => {
    it("should load Cloudinary configuration", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "my-cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "api-key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "api-secret";

      const config = loadCloudinaryConfig();

      expect(config.provider).toBe("cloudinary");
      expect(config.cloudName).toBe("my-cloud");
      expect(config.apiKey).toBe("api-key");
      expect(config.apiSecret).toBe("api-secret");
    });

    it("should throw error when required fields are missing", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "my-cloud";
      // Missing API key and secret

      expect(() => loadCloudinaryConfig()).toThrow(
        "Missing required environment variable: KUMIX_CLOUDINARY_API_KEY",
      );
    });

    it("should throw error when empty string values", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "";
      process.env.KUMIX_CLOUDINARY_API_KEY = "";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "";

      expect(() => loadCloudinaryConfig()).toThrow(
        "Missing required environment variable: KUMIX_CLOUDINARY_CLOUD_NAME",
      );
    });
  });

  describe("hasStorageConfig", () => {
    it("should return true when S3 is configured", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";

      expect(hasStorageConfig()).toBe(true);
    });

    it("should return true when Cloudinary is configured", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "test-key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "test-secret";

      expect(hasStorageConfig()).toBe(true);
    });

    it("should return false when no storage is configured", () => {
      expect(hasStorageConfig()).toBe(false);
    });

    it("should return false when configuration is incomplete", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      // Missing other required fields

      expect(hasStorageConfig()).toBe(false);
    });
  });

  describe("isStorageConfigured", () => {
    it("should be an alias for hasStorageConfig", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "test-key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "test-bucket";

      expect(isStorageConfigured()).toBe(hasStorageConfig());
    });
  });

  describe("validateS3EnvVars", () => {
    it("should pass with all required env vars", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      process.env.KUMIX_S3_ACCESS_KEY_ID = "key";
      process.env.KUMIX_S3_SECRET_ACCESS_KEY = "secret";
      process.env.KUMIX_S3_REGION = "us-east-1";
      process.env.KUMIX_S3_BUCKET = "bucket";

      const result = validateS3EnvVars();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should report missing fields", () => {
      process.env.KUMIX_S3_PROVIDER = "aws";
      const result = validateS3EnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it("should accept explicit EnvRecord", () => {
      const result = validateS3EnvVars({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("validateCloudinaryEnvVars", () => {
    it("should pass with all required env vars", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "cloud";
      process.env.KUMIX_CLOUDINARY_API_KEY = "key";
      process.env.KUMIX_CLOUDINARY_API_SECRET = "secret";

      const result = validateCloudinaryEnvVars();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should report missing fields", () => {
      process.env.KUMIX_CLOUDINARY_CLOUD_NAME = "cloud";
      const result = validateCloudinaryEnvVars();
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it("should accept explicit EnvRecord", () => {
      const result = validateCloudinaryEnvVars({
        KUMIX_CLOUDINARY_CLOUD_NAME: "cloud",
        KUMIX_CLOUDINARY_API_KEY: "key",
        KUMIX_CLOUDINARY_API_SECRET: "secret",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("EnvRecord (explicit env parameter)", () => {
    it("loadS3Config should work with explicit env", () => {
      const config = loadS3Config({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
      });
      expect(config.provider).toBe("aws");
      expect(config.bucket).toBe("bucket");
    });

    it("loadCloudinaryConfig should work with explicit env", () => {
      const config = loadCloudinaryConfig({
        KUMIX_CLOUDINARY_CLOUD_NAME: "cloud",
        KUMIX_CLOUDINARY_API_KEY: "key",
        KUMIX_CLOUDINARY_API_SECRET: "secret",
      });
      expect(config.provider).toBe("cloudinary");
      expect(config.cloudName).toBe("cloud");
    });

    it("loadStorageConfig should work with explicit env", () => {
      const config = loadStorageConfig({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
      });
      expect(config.provider).toBe("aws");
    });

    it("hasStorageConfig should work with explicit env", () => {
      expect(hasStorageConfig({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
      })).toBe(true);
      expect(hasStorageConfig({})).toBe(false);
    });

    it("getStorageProvider should work with explicit env", () => {
      const provider = getStorageProvider({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_ACCESS_KEY_ID: "key",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
        KUMIX_S3_REGION: "us-east-1",
        KUMIX_S3_BUCKET: "bucket",
      });
      expect(provider).toBe("aws");
    });

    it("getStorageEnvVars should work with explicit env", () => {
      const vars = getStorageEnvVars({
        KUMIX_S3_PROVIDER: "aws",
        KUMIX_S3_BUCKET: "my-bucket",
        KUMIX_S3_SECRET_ACCESS_KEY: "secret",
      });
      expect(vars.KUMIX_S3_PROVIDER).toBe("aws");
      expect(vars.KUMIX_S3_BUCKET).toBe("my-bucket");
      expect(vars.KUMIX_S3_SECRET_ACCESS_KEY).toContain("***");
    });
  });
});
