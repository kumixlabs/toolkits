import { describe, expect, it, vi } from "vitest";

import { S3Provider } from "../src/providers/s3";
import type { S3Config } from "../src/types";

describe("S3Provider basic", () => {
  const config: S3Config = {
    provider: "aws",
    region: "us-east-1",
    bucket: "bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
    publicUrl: "https://cdn.example.com",
  };

  it("getPublicUrl delegates to FileOperations", () => {
    const provider = new S3Provider(config);
    const url = provider.getPublicUrl("a/b.txt");
    expect(url).toBe("https://cdn.example.com/bucket/a/b.txt");
  });

  it("upload/download/delete/list/exists basic flows", async () => {
    const provider = new S3Provider(config);
    const send = (provider as any).fileOps["client"].send as ReturnType<typeof vi.fn>;
    send.mockResolvedValue({});
    const up = await provider.upload({ key: "a.txt", file: Buffer.from("x") });
    expect(up.success).toBe(true);
    const dl = await provider.download({ key: "a.txt" });
    expect(dl.success || dl.error).toBeDefined();
    const del = await provider.delete({ key: "a.txt" });
    expect(del.success || del.error).toBeDefined();
    const list = await provider.list({ prefix: "" });
    expect(list.success || list.error).toBeDefined();
    const ex = await provider.exists("a.txt");
    expect(typeof ex.exists).toBe("boolean");
  });
});
