import { v2 as cloudinary } from "cloudinary";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("CloudinaryProvider url + mime branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublicUrl infers image resource type from extension", () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const url = provider.getPublicUrl("photo", "png");
    expect(url).toBe("http://res.cloudinary.com/cloud/image/upload/photo.png");
  });

  it("getPublicUrl infers video resource type from extension", () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const url = provider.getPublicUrl("clip", "mp4");
    expect(url).toBe("http://res.cloudinary.com/cloud/video/upload/clip.mp4");
  });

  it("getPublicUrl falls back to raw for unknown extension", () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const url = provider.getPublicUrl("archive", "bin");
    expect(url).toBe("http://res.cloudinary.com/cloud/raw/upload/archive.bin");
  });

  it("getPublicUrl honors explicit resource type over inference", () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const url = provider.getPublicUrl("thing", "bin", "image");
    expect(url).toBe("http://res.cloudinary.com/cloud/image/upload/thing.bin");
  });

  it("getPublicUrl does not double-prefix an already-scoped key", () => {
    const provider = new CloudinaryProvider(config);
    const url = provider.getPublicUrl("uploads/folder/photo", "png");
    expect(url).toBe("https://res.cloudinary.com/cloud/image/upload/uploads/folder/photo.png");
  });

  it("getPublicUrl prepends config folder for a relative key", () => {
    const provider = new CloudinaryProvider(config);
    const url = provider.getPublicUrl("folder/photo", "png");
    expect(url).toBe("https://res.cloudinary.com/cloud/image/upload/uploads/folder/photo.png");
  });

  it("download without extension defaults to raw resource type", async () => {
    const provider = new CloudinaryProvider(configNoFolder);
    const headers = { get: (_: string) => null };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from("abc"),
      headers,
      status: 200,
      statusText: "OK",
    } as any);
    const res = await provider.download({ key: "file" });
    expect(res.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith("http://res.cloudinary.com/cloud/raw/upload/file");
  });

  it("list maps raw + non-override format to octet-stream mime", async () => {
    (cloudinary.api as any).resources = vi.fn().mockResolvedValue({
      resources: [
        {
          public_id: "docs/report",
          bytes: 20,
          created_at: "2024-01-01",
          etag: "e2",
          format: "bin",
          resource_type: "raw",
        },
      ],
      next_cursor: undefined,
    });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "docs/" });
    expect(res.success).toBe(true);
    expect(res.files?.[0]?.contentType).toBe("application/octet-stream");
  });

  it("list maps image + override format (jpg) to image/jpeg mime", async () => {
    (cloudinary.api as any).resources = vi.fn().mockResolvedValue({
      resources: [
        {
          public_id: "pics/photo",
          bytes: 30,
          created_at: "2024-01-01",
          etag: "e3",
          format: "jpg",
          resource_type: "image",
        },
      ],
      next_cursor: undefined,
    });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "pics/" });
    expect(res.success).toBe(true);
    expect(res.files?.[0]?.contentType).toBe("image/jpeg");
  });

  it("list maps video + plain format to video/<fmt> mime", async () => {
    (cloudinary.api as any).resources = vi.fn().mockResolvedValue({
      resources: [
        {
          public_id: "vids/clip",
          bytes: 40,
          created_at: "2024-01-01",
          etag: "e4",
          format: "webm",
          resource_type: "video",
        },
      ],
      next_cursor: undefined,
    });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "vids/" });
    expect(res.success).toBe(true);
    expect(res.files?.[0]?.contentType).toBe("video/webm");
  });

  it("list maps resource without format to octet-stream mime", async () => {
    (cloudinary.api as any).resources = vi.fn().mockResolvedValue({
      resources: [
        {
          public_id: "misc/thing",
          bytes: 5,
          created_at: "2024-01-01",
          etag: "e5",
          resource_type: "raw",
        },
      ],
      next_cursor: undefined,
    });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "misc/" });
    expect(res.success).toBe(true);
    expect(res.files?.[0]?.contentType).toBe("application/octet-stream");
  });
});
