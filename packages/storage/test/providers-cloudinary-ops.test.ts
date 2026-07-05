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
};

describe("CloudinaryProvider delete/list/folder branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cloudinary.api as any).resource = vi.fn();
    (cloudinary.api as any).resources = vi.fn();
    (cloudinary.api as any).delete_resources_by_prefix = vi.fn().mockResolvedValue({});
    (cloudinary.api as any).delete_folder = vi.fn().mockResolvedValue({});
    (cloudinary.api as any).root_folders = vi.fn();
    (cloudinary.uploader as any).destroy = vi.fn().mockResolvedValue({ result: "ok" });
  });

  it("delete resolves image resource type", async () => {
    (cloudinary.api.resource as any).mockResolvedValueOnce({});
    const provider = new CloudinaryProvider(config);
    const res = await provider.delete({ key: "folder/photo.jpg" });
    expect(res.success).toBe(true);
  });

  it("delete falls back to video resource type", async () => {
    (cloudinary.api.resource as any)
      .mockRejectedValueOnce(new Error("no image"))
      .mockResolvedValueOnce({});
    const provider = new CloudinaryProvider(config);
    const res = await provider.delete({ key: "folder/clip.mp4" });
    expect(res.success).toBe(true);
  });

  it("delete falls back to raw resource type", async () => {
    (cloudinary.api.resource as any).mockRejectedValue(new Error("nope"));
    const provider = new CloudinaryProvider(configNoFolder);
    const res = await provider.delete({ key: "file.bin" });
    expect(res.success).toBe(true);
  });

  it("delete single-segment key without folder config", async () => {
    (cloudinary.api.resource as any).mockRejectedValue(new Error("nope"));
    const provider = new CloudinaryProvider(configNoFolder);
    const res = await provider.delete({ key: "file" });
    expect(res.success).toBe(true);
  });

  it("delete returns error when destroy throws", async () => {
    (cloudinary.api.resource as any).mockRejectedValue(new Error("nope"));
    (cloudinary.uploader.destroy as any).mockRejectedValueOnce(new Error("destroy boom"));
    const provider = new CloudinaryProvider(config);
    const res = await provider.delete({ key: "folder/photo.jpg" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("destroy boom");
  });

  it("list aggregates resources across types", async () => {
    (cloudinary.api.resources as any)
      .mockResolvedValueOnce({
        resources: [
          { public_id: "img1", bytes: 10, created_at: "2024-01-01", etag: "e1", format: "png", resource_type: "image" },
        ],
        next_cursor: "cursor-img",
      })
      .mockResolvedValueOnce({ resources: [{ public_id: "vid1" }], next_cursor: undefined })
      .mockResolvedValueOnce({ resources: [], next_cursor: undefined });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "folder/", maxKeys: 10, continuationToken: "c" });
    expect(res.success).toBe(true);
    expect(res.files!.length).toBe(2);
    expect(res.isTruncated).toBe(true);
    expect(res.nextContinuationToken).toBe("cursor-img");
  });

  it("list uses defaults and handles empty resources", async () => {
    (cloudinary.api.resources as any).mockResolvedValue({ resources: [], next_cursor: undefined });
    const provider = new CloudinaryProvider(config);
    const res = await provider.list();
    expect(res.success).toBe(true);
    expect(res.files).toEqual([]);
    expect(res.isTruncated).toBe(false);
  });

  it("list handles per-type rejection via catch fallback", async () => {
    (cloudinary.api.resources as any).mockRejectedValue(new Error("api down"));
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "x" });
    expect(res.success).toBe(true);
    expect(res.files).toEqual([]);
  });

  it("deleteFolder recursive deletes resources first", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.deleteFolder({ path: "folder/", recursive: true });
    expect(res.success).toBe(true);
    expect(cloudinary.api.delete_resources_by_prefix).toHaveBeenCalledWith("folder");
  });

  it("deleteFolder non-recursive just deletes folder", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.deleteFolder({ path: "folder" });
    expect(res.success).toBe(true);
    expect(cloudinary.api.delete_resources_by_prefix).not.toHaveBeenCalled();
  });

  it("deleteFolder returns error when api throws", async () => {
    (cloudinary.api.delete_folder as any).mockRejectedValueOnce(new Error("del boom"));
    const provider = new CloudinaryProvider(config);
    const res = await provider.deleteFolder({ path: "folder" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("del boom");
  });

  it("listFolders returns mapped folders", async () => {
    (cloudinary.api.root_folders as any).mockResolvedValueOnce({
      folders: [{ name: "a", path: "a" }, { name: "b", path: "b" }],
    });
    const provider = new CloudinaryProvider(config);
    const res = await provider.listFolders();
    expect(res.success).toBe(true);
    expect(res.folders!.length).toBe(2);
  });

  it("listFolders handles missing folders array", async () => {
    (cloudinary.api.root_folders as any).mockResolvedValueOnce({});
    const provider = new CloudinaryProvider(config);
    const res = await provider.listFolders();
    expect(res.success).toBe(true);
    expect(res.folders).toEqual([]);
  });

  it("listFolders returns error when api throws", async () => {
    (cloudinary.api.root_folders as any).mockRejectedValueOnce(new Error("lf boom"));
    const provider = new CloudinaryProvider(config);
    const res = await provider.listFolders();
    expect(res.success).toBe(false);
    expect(res.error).toBe("lf boom");
  });
});
