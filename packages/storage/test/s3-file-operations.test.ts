import { describe, expect, it, vi } from "vitest";

import { FileOperations } from "../src/operations/file-operations";
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

describe("S3 FileOperations", () => {
  const config: S3Config = {
    provider: "aws",
    region: "us-east-1",
    bucket: "bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
    publicUrl: "https://cdn.example.com",
  };

  it("upload returns success and public URL", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ ETag: '"abc123"' }) };
    const ops = new FileOperations(client, config);
    const res = await ops.upload({
      key: "a/b.txt",
      file: Buffer.from("hello"),
    });
    expect(res.success).toBe(true);
    expect(res.publicUrl).toBe("https://cdn.example.com/bucket/a/b.txt");
    expect(res.etag).toBe("abc123");
    expect(res.size).toBe(5);
  });

  it("download streams content to buffer", async () => {
    const body = makeWebStream([Buffer.from("a"), Buffer.from("b")]);
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Body: body,
        ContentType: "text/plain",
        ContentLength: 2,
        LastModified: new Date(),
        ETag: '"etag"',
        Metadata: { x: "y" },
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.download({ key: "a/b.txt" });
    expect(res.success).toBe(true);
    expect(res.content?.toString()).toBe("ab");
    expect(res.contentType).toBe("text/plain");
    expect(res.etag).toBe("etag");
    expect(res.metadata?.x).toBe("y");
  });

  it("delete returns success", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FileOperations(client, config);
    const res = await ops.delete({ key: "a/b.txt" });
    expect(res.success).toBe(true);
  });

  it("batchDelete returns deleted keys", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Deleted: [{ Key: "a.txt" }, { Key: "b.txt" }],
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.batchDelete({ keys: ["a.txt", "b.txt"] });
    expect(res.success).toBe(true);
    expect(res.deleted).toEqual(["a.txt", "b.txt"]);
  });

  it("list returns files and prefixes", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Contents: [
          { Key: "a.txt", Size: 1, LastModified: new Date(), ETag: '"e1"' },
          { Key: "b.pdf", Size: 2, LastModified: new Date(), ETag: '"e2"' },
        ],
        CommonPrefixes: [{ Prefix: "folder/" }],
        IsTruncated: false,
        NextContinuationToken: undefined,
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.list({ prefix: "prefix/" });
    expect(res.success).toBe(true);
    expect(res.files).toBeDefined();
    expect(res.files!.length).toBe(2);
    expect(res.commonPrefixes).toEqual(["folder/"]);
    expect(res.isTruncated).toBe(false);
  });

  it("exists returns file info", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        ContentLength: 10,
        LastModified: new Date(),
        ETag: '"etag"',
        ContentType: "text/plain",
        Metadata: { a: "b" },
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.exists("a.txt");
    expect(res.exists).toBe(true);
    expect(res.fileInfo?.etag).toBe("etag");
    expect(res.fileInfo?.contentType).toBe("text/plain");
  });

  it("copy returns etag", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        CopyObjectResult: { ETag: '"etag123"' },
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.copy({ sourceKey: "a.txt", destinationKey: "b.txt" });
    expect(res.success).toBe(true);
    expect(res.etag).toBe("etag123");
  });

  it("move performs copy and delete", async () => {
    const client: any = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e1"' } })
        .mockResolvedValueOnce({}),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.move({ sourceKey: "a.txt", destinationKey: "b.txt" });
    expect(res.success).toBe(true);
    expect(res.etag).toBe("e1");
    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it("duplicate delegates to copy", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({ CopyObjectResult: { ETag: '"e2"' } }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.duplicate({ sourceKey: "a.txt", destinationKey: "c.txt" });
    expect(res.success).toBe(true);
    expect(res.etag).toBe("e2");
  });

  it("getPresignedUrl returns URL for get and put", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FileOperations(client, config);
    const getUrl = await ops.getPresignedUrl({ key: "a.txt", operation: "get" });
    const putUrl = await ops.getPresignedUrl({
      key: "b.txt",
      operation: "put",
      contentType: "text/plain",
    });
    expect(getUrl.success).toBe(true);
    expect(putUrl.success).toBe(true);
    expect(getUrl.url).toContain("https://");
    expect(putUrl.url).toContain("https://");
  });

  it("getPublicUrl prefers publicUrl then endpoint then default", () => {
    const client: any = { send: vi.fn() };
    const ops1 = new FileOperations(client, {
      ...config,
      publicUrl: "https://cdn.example.com",
      endpoint: undefined,
    });
    expect(ops1.getPublicUrl("a/b.txt")).toBe("https://cdn.example.com/bucket/a/b.txt");
    const ops2 = new FileOperations(client, {
      ...config,
      publicUrl: undefined,
      endpoint: "https://endpoint.example.com",
    });
    expect(ops2.getPublicUrl("a/b.txt")).toBe("https://endpoint.example.com/bucket/a/b.txt");
    const ops3 = new FileOperations(client, {
      ...config,
      publicUrl: undefined,
      endpoint: undefined,
    });
    expect(ops3.getPublicUrl("a/b.txt")).toBe(
      "https://bucket.s3.us-east-1.amazonaws.com/a/b.txt",
    );
  });
});
