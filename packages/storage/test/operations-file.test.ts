import { describe, expect, it, vi } from "vitest";

import { FileOperations } from "../src/operations/file-operations";
import type { S3Config } from "../src/types";

const config: S3Config = {
  provider: "aws",
  region: "us-east-1",
  bucket: "bucket",
  accessKeyId: "key",
  secretAccessKey: "secret",
};

describe("FileOperations error and edge branches", () => {
  it("upload returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("up boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.upload({ key: "a.txt", file: Buffer.from("x") });
    expect(res.success).toBe(false);
    expect(res.error).toBe("up boom");
  });

  it("upload returns generic error on non-Error throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue("weird") };
    const ops = new FileOperations(client, config);
    const res = await ops.upload({ key: "a.txt", file: Buffer.from("x") });
    expect(res.error).toBe("Upload failed");
  });

  it("upload computes size for string body", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ ETag: '"e"' }) };
    const ops = new FileOperations(client, config);
    const res = await ops.upload({ key: "a.txt", file: "hello" });
    expect(res.size).toBe(5);
  });

  it("upload passes optional metadata options", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ ETag: '"e"' }) };
    const ops = new FileOperations(client, config);
    const res = await ops.upload({
      key: "a.txt",
      file: Buffer.from("x"),
      contentType: "text/plain",
      metadata: { a: "b" },
      cacheControl: "no-cache",
      contentDisposition: "inline",
      acl: "public-read",
      expires: new Date(),
    });
    expect(res.success).toBe(true);
  });

  it("download with Range option", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Body: { transformToWebStream: () => ({ getReader: () => ({ read: async () => ({ done: true }) }) }) },
        ContentType: "text/plain",
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.download({ key: "a.txt", range: "bytes=0-10" });
    expect(res.success).toBe(true);
  });

  it("download returns error when no body", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ Body: undefined }) };
    const ops = new FileOperations(client, config);
    const res = await ops.download({ key: "a.txt" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("No data received");
  });

  it("download returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("dl boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.download({ key: "a.txt" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("dl boom");
  });

  it("delete returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue("x") };
    const ops = new FileOperations(client, config);
    const res = await ops.delete({ key: "a.txt" });
    expect(res.error).toBe("Delete failed");
  });

  it("batchDelete maps errors from result", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Deleted: [{ Key: "a.txt" }],
        Errors: [{ Key: "b.txt", Message: "denied" }, { Key: undefined, Message: undefined }],
      }),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.batchDelete({ keys: ["a.txt", "b.txt"] });
    expect(res.success).toBe(true);
    expect(res.errors!.length).toBe(2);
    expect(res.errors![1].error).toBe("Unknown error");
  });

  it("batchDelete returns error list on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("bd boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.batchDelete({ keys: ["a.txt"] });
    expect(res.success).toBe(false);
    expect(res.errors![0].error).toBe("bd boom");
  });

  it("list returns empty files when no contents", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FileOperations(client, config);
    const res = await ops.list();
    expect(res.success).toBe(true);
    expect(res.files).toEqual([]);
  });

  it("list returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("list boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.list({ prefix: "x" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("list boom");
  });

  it("exists returns false when NotFound", async () => {
    const err = new Error("missing");
    err.name = "NotFound";
    const client: any = { send: vi.fn().mockRejectedValue(err) };
    const ops = new FileOperations(client, config);
    const res = await ops.exists("a.txt");
    expect(res.exists).toBe(false);
    expect(res.error).toBeUndefined();
  });

  it("exists returns error on other failures", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.exists("a.txt");
    expect(res.exists).toBe(false);
    expect(res.error).toBe("boom");
  });

  it("copy returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("copy boom")) };
    const ops = new FileOperations(client, config);
    const res = await ops.copy({ sourceKey: "a", destinationKey: "b" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("copy boom");
  });

  it("move returns error when copy fails", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("copy fail")) };
    const ops = new FileOperations(client, config);
    const res = await ops.move({ sourceKey: "a", destinationKey: "b" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("copy fail");
  });

  it("move returns error when delete fails", async () => {
    const client: any = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ CopyObjectResult: { ETag: '"e"' } })
        .mockRejectedValueOnce(new Error("del fail")),
    };
    const ops = new FileOperations(client, config);
    const res = await ops.move({ sourceKey: "a", destinationKey: "b" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("del fail");
  });

  it("getPresignedUrl returns error on throw", async () => {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    (getSignedUrl as any).mockRejectedValueOnce(new Error("sign boom"));
    const client: any = { send: vi.fn() };
    const ops = new FileOperations(client, config);
    const res = await ops.getPresignedUrl({ key: "a", operation: "get" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("sign boom");
  });

  it("getPublicUrl handles cloudflare-r2 and supabase providers", () => {
    const client: any = { send: vi.fn() };
    const r2 = new FileOperations(client, {
      ...config,
      provider: "cloudflare-r2",
      publicUrl: "https://r2.example.com",
    });
    expect(r2.getPublicUrl("a.txt")).toBe("https://r2.example.com/a.txt");
    const supa = new FileOperations(client, {
      ...config,
      provider: "supabase",
      publicUrl: undefined,
      endpoint: "https://proj.storage.supabase.co/storage/v1/s3",
    });
    expect(supa.getPublicUrl("a.txt")).toContain("/storage/v1/object/public");
  });
});
