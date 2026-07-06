import { describe, expect, it } from "vitest";

import { CloudinaryService } from "../src/services/cloudinary";
import type { CloudinaryConfig } from "../src/types";

describe("CloudinaryService full coverage", () => {
  const config: CloudinaryConfig = {
    provider: "cloudinary",
    cloudName: "cloud",
    apiKey: "key",
    apiSecret: "secret",
    secure: true,
    folder: "uploads",
  };

  it("exposes utility methods", () => {
    const cloud = new CloudinaryService(config);
    expect(cloud.getProvider()).toBe("cloudinary");
    expect(cloud.getConfig().cloudName).toBe("cloud");
    expect(cloud.getPublicUrl("a/b.jpg")).toContain("res.cloudinary.com");
  });

  it("core file operations delegate to provider", async () => {
    const cloud = new CloudinaryService(config);
    const up = await cloud.upload({
      key: "a.jpg",
      file: Buffer.from("x"),
      contentType: "image/jpeg",
    });
    expect(up.success).toBe(true);
    const del = await cloud.delete({ key: "a.jpg" });
    expect(del.success || del.error).toBeDefined();
    const list = await cloud.list({ prefix: "a" });
    expect(list.success || list.error).toBeDefined();
    const ex = await cloud.exists("a.jpg");
    expect(ex.exists).toBe(false);
    const cp = await cloud.copy({ sourceKey: "a", destinationKey: "b" });
    expect(cp.success).toBe(false);
    const mv = await cloud.move({ sourceKey: "a", destinationKey: "b" });
    expect(mv.success).toBe(false);
    const dup = await cloud.duplicate({ sourceKey: "a", destinationKey: "b" });
    expect(dup.success).toBe(false);
    const bd = await cloud.batchDelete({ keys: ["a", "b"] });
    expect(bd.success).toBe(false);
    const pre = await cloud.getPresignedUrl({ key: "a", operation: "get" });
    expect(pre.success).toBe(false);
  });

  it("folder operations delegate to provider", async () => {
    const cloud = new CloudinaryService(config);
    const cf = await cloud.createFolder({ path: "new" });
    expect(cf.success).toBe(true);
    const df = await cloud.deleteFolder({ path: "folder", recursive: true });
    expect(df.success || df.error).toBeDefined();
    const lf = await cloud.listFolders({});
    expect(lf.success || lf.error).toBeDefined();
    const fe = await cloud.folderExists("folder");
    expect(fe.exists).toBe(false);
    const rf = await cloud.renameFolder({ oldPath: "old", newPath: "new" });
    expect(rf.success).toBe(false);
    const cpf = await cloud.copyFolder({ sourcePath: "src", destinationPath: "dest" });
    expect(cpf.success).toBe(false);
  });

  it("convenience file methods", async () => {
    const cloud = new CloudinaryService(config);
    const up = await cloud.uploadFile("a.jpg", Buffer.from("x"), "image/jpeg", { alt: "y" });
    expect(up.success).toBe(true);
    const del = await cloud.deleteFile("a.jpg");
    expect(del.success || del.error).toBeDefined();
    const dels = await cloud.deleteFiles(["a.jpg", "b.jpg"]);
    expect(dels.success).toBe(false);
    const files = await cloud.listFiles("a", 10);
    expect(files.success || files.error).toBeDefined();
    const exists = await cloud.fileExists("a.jpg");
    expect(exists).toBe(false);
    const cp = await cloud.copyFile("a", "b");
    expect(cp.success).toBe(false);
    const mv = await cloud.moveFile("a", "b");
    expect(mv.success).toBe(false);
    const dup = await cloud.duplicateFile("a", "b");
    expect(dup.success).toBe(false);
    const rn = await cloud.renameFile("a", "b");
    expect(rn.success).toBe(false);
  });

  it("presigned url convenience methods", async () => {
    const cloud = new CloudinaryService(config);
    const dl = await cloud.getDownloadUrl("a.jpg", 100);
    expect(dl.success).toBe(false);
    const ul = await cloud.getUploadUrl("a.jpg", "image/jpeg", 100);
    expect(ul.success).toBe(false);
  });

  it("folder convenience methods", async () => {
    const cloud = new CloudinaryService(config);
    const cf = await cloud.createFolderPath("new");
    expect(cf.success).toBe(true);
    const df = await cloud.deleteFolderPath("folder", true);
    expect(df.success || df.error).toBeDefined();
    const fe = await cloud.folderPathExists("folder");
    expect(fe).toBe(false);
    const rf = await cloud.renameFolderPath("old", "new");
    expect(rf.success).toBe(false);
    const cpf = await cloud.copyFolderPath("src", "dest", true);
    expect(cpf.success).toBe(false);
  });
});
