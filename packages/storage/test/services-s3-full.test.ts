import { describe, expect, it, vi } from "vitest";

import { S3Service } from "../src/services/s3";
import type { S3Config } from "../src/types";

function getSend(svc: S3Service): ReturnType<typeof vi.fn> {
  return (svc as any).provider.fileOps.client.send as ReturnType<typeof vi.fn>;
}

describe("S3Service full coverage", () => {
  const config: S3Config = {
    provider: "aws",
    region: "us-east-1",
    bucket: "bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
    publicUrl: "https://cdn.example.com",
  };

  it("throws on unsupported provider", () => {
    expect(() => new S3Service({ ...config, provider: "invalid" as any })).toThrow(
      "Unsupported S3 provider",
    );
  });

  it("supports all valid providers", () => {
    const providers: S3Config["provider"][] = [
      "aws",
      "cloudflare-r2",
      "minio",
      "digitalocean",
      "supabase",
      "custom",
    ];
    for (const provider of providers) {
      const svc = new S3Service({ ...config, provider });
      expect(svc.getProvider()).toBe(provider);
    }
  });

  it("utility getters", () => {
    const s3 = new S3Service(config);
    expect(s3.getConfig().bucket).toBe("bucket");
    expect(s3.getBucket()).toBe("bucket");
    expect(s3.getRegion()).toBe("us-east-1");
    expect(s3.getProvider()).toBe("aws");
  });

  it("core operations delegate to provider", async () => {
    const s3 = new S3Service(config);
    const send = getSend(s3);
    send.mockResolvedValue({});
    const up = await s3.upload({ key: "a.txt", file: Buffer.from("x") });
    expect(up.success).toBe(true);
    const del = await s3.delete({ key: "a.txt" });
    expect(del.success).toBe(true);
    send.mockResolvedValueOnce({ Deleted: [{ Key: "a.txt" }] });
    const bd = await s3.batchDelete({ keys: ["a.txt"] });
    expect(bd.success).toBe(true);
    const list = await s3.list({ prefix: "a" });
    expect(list.success).toBe(true);
    const ex = await s3.exists("a.txt");
    expect(typeof ex.exists).toBe("boolean");
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } });
    const cp = await s3.copy({ sourceKey: "a.txt", destinationKey: "b.txt" });
    expect(cp.success).toBe(true);
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } }).mockResolvedValueOnce({});
    const mv = await s3.move({ sourceKey: "a.txt", destinationKey: "b.txt" });
    expect(mv.success).toBe(true);
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } });
    const dup = await s3.duplicate({ sourceKey: "a.txt", destinationKey: "c.txt" });
    expect(dup.success).toBe(true);
    const pre = await s3.getPresignedUrl({ key: "a.txt", operation: "get" });
    expect(pre.success).toBe(true);
  });

  it("folder operations delegate to provider", async () => {
    const s3 = new S3Service(config);
    const folderSend = (s3 as any).provider.folderOps.client.send as ReturnType<typeof vi.fn>;
    folderSend.mockResolvedValue({});
    const cf = await s3.createFolder({ path: "folder" });
    expect(cf.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Deleted: [{ Key: "folder/" }] });
    const df = await s3.deleteFolder({ path: "folder", recursive: false });
    expect(df.success).toBe(true);
    folderSend.mockResolvedValueOnce({ CommonPrefixes: [{ Prefix: "folder/" }] });
    const lf = await s3.listFolders({ prefix: "" });
    expect(lf.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Contents: [{ Key: "folder/a.txt" }] });
    const fe = await s3.folderExists("folder");
    expect(fe.exists).toBe(true);
    folderSend
      .mockResolvedValueOnce({ Contents: [{ Key: "old/a.txt" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Deleted: [{ Key: "old/a.txt" }] });
    const rf = await s3.renameFolder({ oldPath: "old", newPath: "new" });
    expect(rf.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Contents: [{ Key: "src/a.txt" }] }).mockResolvedValueOnce({});
    const cpf = await s3.copyFolder({ sourcePath: "src", destinationPath: "dest" });
    expect(cpf.success).toBe(true);
  });

  it("convenience file methods", async () => {
    const s3 = new S3Service(config);
    const send = getSend(s3);
    send.mockResolvedValue({});
    const up = await s3.uploadFile("a.txt", Buffer.from("x"), { contentType: "text/plain" });
    expect(up.success).toBe(true);
    const del = await s3.deleteFile("a.txt");
    expect(del.success).toBe(true);
    send.mockResolvedValueOnce({ Deleted: [{ Key: "a.txt" }] });
    const dels = await s3.deleteFiles(["a.txt"]);
    expect(dels.success).toBe(true);
    const list = await s3.listFiles("a", 10);
    expect(list.success).toBe(true);
    const exists = await s3.fileExists("a.txt");
    expect(typeof exists).toBe("boolean");
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } });
    const cp = await s3.copyFile("a.txt", "b.txt");
    expect(cp.success).toBe(true);
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } }).mockResolvedValueOnce({});
    const mv = await s3.moveFile("a.txt", "b.txt");
    expect(mv.success).toBe(true);
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } });
    const dup = await s3.duplicateFile("a.txt", "c.txt");
    expect(dup.success).toBe(true);
    send.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } }).mockResolvedValueOnce({});
    const rn = await s3.renameFile("a.txt", "d.txt");
    expect(rn.success).toBe(true);
  });

  it("presigned url convenience methods", async () => {
    const s3 = new S3Service(config);
    const dl = await s3.getDownloadUrl("a.txt", 100);
    expect(dl.success).toBe(true);
    const ul = await s3.getUploadUrl("a.txt", "text/plain", 100);
    expect(ul.success).toBe(true);
  });

  it("folder convenience methods", async () => {
    const s3 = new S3Service(config);
    const folderSend = (s3 as any).provider.folderOps.client.send as ReturnType<typeof vi.fn>;
    folderSend.mockResolvedValue({});
    const cf = await s3.createFolderPath("folder");
    expect(cf.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Deleted: [{ Key: "folder/" }] });
    const df = await s3.deleteFolderPath("folder");
    expect(df.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Contents: [{ Key: "folder/a.txt" }] });
    const fe = await s3.folderPathExists("folder");
    expect(fe).toBe(true);
    folderSend
      .mockResolvedValueOnce({ Contents: [{ Key: "old/a.txt" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Deleted: [{ Key: "old/a.txt" }] });
    const rf = await s3.renameFolderPath("old", "new");
    expect(rf.success).toBe(true);
    folderSend.mockResolvedValueOnce({ Contents: [{ Key: "src/a.txt" }] }).mockResolvedValueOnce({});
    const cpf = await s3.copyFolderPath("src", "dest");
    expect(cpf.success).toBe(true);
  });
});
