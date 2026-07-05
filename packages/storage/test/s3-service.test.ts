import { describe, expect, it, vi } from "vitest";

import { S3Service } from "../src/services/s3";
import type { S3Config } from "../src/types";

function makeWebReader(chunks: Uint8Array[]) {
  let i = 0;
  return {
    async read() {
      if (i >= chunks.length) return { done: true, value: undefined };
      const value = chunks[i++];
      return { done: false, value };
    },
  };
}

function makeWebStream(chunks: Uint8Array[]) {
  return {
    transformToWebStream() {
      return {
        getReader: () => makeWebReader(chunks),
      };
    },
  };
}

describe("S3Service convenience methods", () => {
  const config: S3Config = {
    provider: "aws",
    region: "us-east-1",
    bucket: "bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
    publicUrl: "https://cdn.example.com",
  };

  it("uploadFile and getPublicUrl", async () => {
    const s3 = new S3Service(config);
    const send = (s3 as any).provider.fileOps.client.send as ReturnType<typeof vi.fn>;
    send.mockResolvedValueOnce({ ETag: '"etag"' });
    const res = await s3.uploadFile("a/b.txt", Buffer.from("hello"));
    expect(res.success).toBe(true);
    expect(s3.getPublicUrl("a/b.txt")).toBe("https://cdn.example.com/bucket/a/b.txt");
  });

  it("downloadFile and deleteFile", async () => {
    const s3 = new S3Service(config);
    const send = (s3 as any).provider.fileOps.client.send as ReturnType<typeof vi.fn>;
    send
      .mockResolvedValueOnce({
        Body: makeWebStream([Buffer.from("a"), Buffer.from("b")]),
        ContentType: "text/plain",
        ContentLength: 2,
        LastModified: new Date(),
        ETag: '"etag"',
        Metadata: {},
      })
      .mockResolvedValueOnce({});
    const dl = await s3.downloadFile("a/b.txt");
    expect(dl.success).toBe(true);
    expect(dl.content?.toString()).toBe("ab");
    const del = await s3.deleteFile("a/b.txt");
    expect(del.success).toBe(true);
  });

  it("presigned URLs", async () => {
    const s3 = new S3Service(config);
    const get = await s3.getDownloadUrl("a/b.txt");
    const put = await s3.getUploadUrl("a/b.txt", "text/plain");
    expect(get.success).toBe(true);
    expect(put.success).toBe(true);
    expect(get.url).toContain("https://");
  });

  it("folder convenience methods", async () => {
    const s3 = new S3Service(config);
    const send = (s3 as any).provider.folderOps.client.send as ReturnType<typeof vi.fn>;
    send
      .mockResolvedValueOnce({}) // createFolder
      .mockResolvedValueOnce({ Deleted: [{ Key: "folder/" }] }) // deleteFolder
      .mockResolvedValueOnce({ Contents: [{ Key: "folder/a.txt" }] }) // folderExists
      .mockResolvedValueOnce({ Contents: [{ Key: "old/a.txt" }] }) // list for rename
      .mockResolvedValueOnce({}) // copy
      .mockResolvedValueOnce({ Deleted: [{ Key: "old/a.txt" }] }) // delete old
      .mockResolvedValueOnce({ Contents: [{ Key: "src/a.txt" }] }) // list for copy folder
      .mockResolvedValueOnce({}); // copy folder
    const cf = await s3.createFolderPath("folder");
    expect(cf.success).toBe(true);
    const df = await s3.deleteFolderPath("folder", false);
    expect(df.success).toBe(true);
    const fe = await s3.folderPathExists("folder");
    expect(fe).toBe(true);
    const rf = await s3.renameFolderPath("old", "new");
    expect(rf.success).toBe(true);
    const cp = await s3.copyFolderPath("src", "dest", true);
    expect(cp.success).toBe(true);
  });
});
