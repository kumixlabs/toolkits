import { beforeEach, describe, expect, it, vi } from "vitest";
import { v2 as cloudinary } from "cloudinary";

import { CloudinaryProvider } from "../src/providers/cloudinary";
import type { CloudinaryConfig } from "../src/types";

const config: CloudinaryConfig = {
  provider: "cloudinary",
  cloudName: "cloud",
  apiKey: "key",
  apiSecret: "secret",
  secure: true,
  folder: "uploads",
};

const configNoFolder: CloudinaryConfig = {
  provider: "cloudinary",
  cloudName: "cloud",
  apiKey: "key",
  apiSecret: "secret",
  secure: false,
};

describe("CloudinaryProvider branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cloudinary.uploader.upload as any).mockResolvedValue({
      public_id: "uploads/folder/photo",
      secure_url: "https://res.cloudinary.com/cloud/image/upload/photo.png",
      etag: "etag123",
      bytes: 100,
      format: "png",
    });
  });

  it("upload with string file (no base64 conversion)", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.upload({ key: "folder/photo.jpg", file: "raw-string" });
    expect(res.success).toBe(true);
    expect(res.key).toBe("uploads/folder/photo");
  });

  it("upload detects image content type", async () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const res = await provider.upload({
      key: "photo.png",
      file: Buffer.from("x"),
      contentType: "image/png",
    });
    expect(res.success).toBe(true);
  });

  it("upload detects video content type", async () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const res = await provider.upload({
      key: "clip.mp4",
      file: Buffer.from("x"),
      contentType: "video/mp4",
    });
    expect(res.success).toBe(true);
  });

  it("upload with raw content type and no folder in key", async () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const res = await provider.upload({
      key: "file.bin",
      file: Buffer.from("x"),
      contentType: "application/octet-stream",
      metadata: { tag: "a" },
    });
    expect(res.success).toBe(true);
  });

  it("upload returns error on failure", async () => {
    (cloudinary.uploader.upload as any).mockRejectedValueOnce(new Error("boom"));
    const provider = new CloudinaryProvider(config);
    const res = await provider.upload({ key: "folder/photo.jpg", file: Buffer.from("x") });
    expect(res.success).toBe(false);
    expect(res.error).toBe("boom");
  });

  it("upload returns generic error on non-Error throw", async () => {
    (cloudinary.uploader.upload as any).mockRejectedValueOnce("weird");
    const provider = new CloudinaryProvider(config);
    const res = await provider.upload({ key: "folder/photo.jpg", file: Buffer.from("x") });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Upload failed");
  });

  it("download handles non-ok response", async () => {
    const provider = new CloudinaryProvider(config);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as any);
    const res = await provider.download({ key: "folder/photo.jpg" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("404");
  });

  it("download handles fetch throwing", async () => {
    const provider = new CloudinaryProvider(config);
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
    const res = await provider.download({ key: "folder/photo.jpg" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("network");
  });

  it("download without last-modified header defaults date", async () => {
    const provider = new CloudinaryProvider(config);
    const headers = { get: (_: string) => null };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from("abc"),
      headers,
      status: 200,
      statusText: "OK",
    } as any);
    const res = await provider.download({ key: "photo.jpg" });
    expect(res.success).toBe(true);
    expect(res.lastModified).toBeInstanceOf(Date);
  });
});
