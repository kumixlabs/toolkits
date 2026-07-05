import { describe, expect, it } from "vitest";

import { S3Service, createS3 } from "../src/s3";
import { CloudinaryService, createCloudinary } from "../src/cloudinary";

describe("Storage Services", () => {
  it("S3Service builds public URL using publicUrl", () => {
    const s3 = new S3Service({
      provider: "aws",
      region: "us-east-1",
      bucket: "bucket",
      accessKeyId: "key",
      secretAccessKey: "secret",
      publicUrl: "https://cdn.example.com",
    });
    expect(s3.getPublicUrl("a/b.txt")).toBe("https://cdn.example.com/bucket/a/b.txt");
    expect(s3.getProvider()).toBe("aws");
  });

  it("S3Service builds default AWS URL when no publicUrl or endpoint", () => {
    const s3 = new S3Service({
      provider: "aws",
      region: "us-east-1",
      bucket: "bucket",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(s3.getPublicUrl("a/b.txt")).toBe(
      "https://bucket.s3.us-east-1.amazonaws.com/a/b.txt",
    );
  });

  it("CloudinaryService exposes provider and config", () => {
    const cloud = new CloudinaryService({
      provider: "cloudinary",
      cloudName: "cloud",
      apiKey: "123456",
      apiSecret: "secret",
      secure: true,
      folder: "uploads",
    });
    expect(cloud.getProvider()).toBe("cloudinary");
    expect(cloud.getConfig().cloudName).toBe("cloud");
  });

  it("createS3 returns instance from explicit config", () => {
    const s3 = createS3({
      provider: "minio",
      region: "us-east-1",
      bucket: "bucket",
      accessKeyId: "minio",
      secretAccessKey: "minio",
      endpoint: "http://localhost:9000",
      forcePathStyle: true,
    });
    expect(s3.getProvider()).toBe("minio");
    expect(s3.getPublicUrl("a.txt")).toBe("http://localhost:9000/bucket/a.txt");
  });

  it("createCloudinary returns instance from explicit config", () => {
    const cloud = createCloudinary({
      provider: "cloudinary",
      cloudName: "cloud",
      apiKey: "123456",
      apiSecret: "secret",
      secure: true,
      folder: "uploads",
    });
    expect(cloud.getProvider()).toBe("cloudinary");
    expect(cloud.getConfig().folder).toBe("uploads");
  });
});
