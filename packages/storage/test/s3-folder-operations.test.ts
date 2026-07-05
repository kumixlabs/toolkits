import { describe, expect, it, vi } from "vitest";

import { FolderOperations } from "../src/operations/folder-operations";
import type { S3Config } from "../src/types";

describe("S3 FolderOperations", () => {
  const config: S3Config = {
    provider: "aws",
    region: "us-east-1",
    bucket: "bucket",
    accessKeyId: "key",
    secretAccessKey: "secret",
  };

  it("createFolder creates placeholder object", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FolderOperations(client, config);
    const res = await ops.createFolder({ path: "folder" });
    expect(res.success).toBe(true);
    expect(res.path).toBe("folder/");
  });

  it("deleteFolder non-recursive deletes placeholder only", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ Deleted: [{ Key: "folder/" }] }) };
    const ops = new FolderOperations(client, config);
    const res = await ops.deleteFolder({ path: "folder", recursive: false });
    expect(res.success).toBe(true);
    expect(res.deletedFiles).toEqual(["folder/"]);
  });

  it("deleteFolder recursive deletes all contents", async () => {
    const client: any = {
      send: vi
        .fn()
        .mockResolvedValueOnce({
          Contents: [{ Key: "folder/a.txt" }, { Key: "folder/b.txt" }],
        })
        .mockResolvedValueOnce({
          Deleted: [{ Key: "folder/a.txt" }, { Key: "folder/b.txt" }],
        }),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.deleteFolder({ path: "folder", recursive: true });
    expect(res.success).toBe(true);
    expect(res.deletedFiles).toEqual(["folder/a.txt", "folder/b.txt"]);
  });

  it("listFolders returns folders and files", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        CommonPrefixes: [{ Prefix: "folder/" }, { Prefix: "folder2/" }],
        Contents: [
          { Key: "folder/a.txt", Size: 1, LastModified: new Date(), ETag: '"e1"' },
          { Key: "folder/b.txt", Size: 2, LastModified: new Date(), ETag: '"e2"' },
        ],
        IsTruncated: false,
        NextContinuationToken: undefined,
      }),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.listFolders({ prefix: "folder/" });
    expect(res.success).toBe(true);
    expect(res.folders).toBeDefined();
    expect(res.files).toBeDefined();
    expect(res.folders!.length).toBe(2);
    expect(res.files!.length).toBe(2);
    expect(res.isTruncated).toBe(false);
  });

  it("folderExists returns folder info when present", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({
        Contents: [{ Key: "folder/a.txt" }],
        CommonPrefixes: [{ Prefix: "folder/" }],
      }),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.folderExists("folder");
    expect(res.exists).toBe(true);
    expect(res.folderInfo?.path).toBe("folder/");
  });

  it("renameFolder copies files and deletes old ones", async () => {
    const client: any = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ Contents: [{ Key: "old/x.txt" }, { Key: "old/y.txt" }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ Deleted: [{ Key: "old/x.txt" }, { Key: "old/y.txt" }] }),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.renameFolder({ oldPath: "old", newPath: "new" });
    expect(res.success).toBe(true);
    expect(res.movedFiles).toEqual(["new/x.txt", "new/y.txt"]);
  });

  it("copyFolder copies files to destination", async () => {
    const client: any = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ Contents: [{ Key: "src/a.txt" }] })
        .mockResolvedValueOnce({}),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.copyFolder({ sourcePath: "src", destinationPath: "dest" });
    expect(res.success).toBe(true);
    expect(res.copiedFiles).toEqual(["dest/a.txt"]);
  });
});
