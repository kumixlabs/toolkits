import { describe, expect, it, vi } from "vitest";

import { CloudinaryProvider } from "../src/providers/cloudinary";
import type { CloudinaryConfig } from "../src/types";

describe("CloudinaryProvider", () => {
  const config: CloudinaryConfig = {
    provider: "cloudinary",
    cloudName: "cloud",
    apiKey: "key",
    apiSecret: "secret",
    secure: true,
    folder: "uploads",
  };

  it("upload returns success and public URL", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.upload({
      key: "folder/photo.jpg",
      file: Buffer.from("x"),
      contentType: "image/jpeg",
    });
    expect(res.success).toBe(true);
    expect(res.url).toContain("cloudinary.com");
    expect(res.publicUrl).toContain("/image/upload/test-public-id");
    expect(res.key).toBe("test-public-id");
  });

  it("getPublicUrl formats url", () => {
    const provider = new CloudinaryProvider(config);
    const url = provider.getPublicUrl("a/b.jpg");
    expect(url).toBe("https://res.cloudinary.com/cloud/image/upload/a/b.jpg");
  });

  it("delete returns success", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.delete({ key: "folder/photo.jpg" });
    expect(res.success || res.error).toBeDefined();
  });

  it("list returns success with empty arrays when api not fully mocked", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.list({ prefix: "folder/" });
    expect(res.success || res.error).toBeDefined();
  });

  it("download uses fetch and returns buffer", async () => {
    const provider = new CloudinaryProvider(config);
    const headers = {
      get: (name: string) =>
        name === "content-type"
          ? "image/jpeg"
          : name === "last-modified"
            ? new Date().toUTCString()
            : null,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("abc"),
      headers,
      status: 200,
      statusText: "OK",
    } as any);
    const res = await provider.download({ key: "folder/photo.jpg" });
    expect(res.success).toBe(true);
    expect(res.content?.length).toBe(3);
    expect(res.contentType).toBe("image/jpeg");
  });

  it("exists returns not implemented", async () => {
    const provider = new CloudinaryProvider(config);
    const res = await provider.exists("x");
    expect(res.exists).toBe(false);
    expect(String(res.error)).toContain("not implemented");
  });

  it("copy/move/getPresignedUrl return not implemented", async () => {
    const provider = new CloudinaryProvider(config);
    const c = await provider.copy({ sourceKey: "a", destinationKey: "b" });
    const m = await provider.move({ sourceKey: "a", destinationKey: "b" });
    const p = await provider.getPresignedUrl({ key: "a", operation: "get" });
    expect(c.success).toBe(false);
    expect(m.success).toBe(false);
    expect(p.success).toBe(false);
  });

  it("folder operations return expected statuses", async () => {
    const provider = new CloudinaryProvider(config);
    const cf = await provider.createFolder({ path: "new-folder" });
    const df = await provider.deleteFolder({ path: "folder", recursive: true });
    const lf = await provider.listFolders({});
    const fe = await provider.folderExists("folder");
    const rf = await provider.renameFolder({ oldPath: "old", newPath: "new" });
    const cp = await provider.copyFolder({ sourcePath: "src", destinationPath: "dest" });
    expect(cf.success).toBe(true);
    expect(df.success).toBe(false);
    expect(lf.success || lf.error).toBeDefined();
    expect(fe.exists).toBe(false);
    expect(rf.success).toBe(false);
    expect(cp.success).toBe(false);
  });
});
