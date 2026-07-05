import { describe, expect, it, vi } from "vitest";

import { FolderOperations } from "../src/operations/folder-operations";
import type { S3Config } from "../src/types";

const config: S3Config = {
  provider: "aws",
  region: "us-east-1",
  bucket: "bucket",
  accessKeyId: "key",
  secretAccessKey: "secret",
};

describe("FolderOperations error and edge branches", () => {
  it("createFolder accepts path already ending with slash", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FolderOperations(client, config);
    const res = await ops.createFolder({ path: "folder/" });
    expect(res.success).toBe(true);
    expect(res.path).toBe("folder/");
  });

  it("createFolder returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("cf boom")) };
    const ops = new FolderOperations(client, config);
    const res = await ops.createFolder({ path: "folder" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("cf boom");
  });

  it("deleteFolder recursive returns empty when no contents", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ Contents: [] }) };
    const ops = new FolderOperations(client, config);
    const res = await ops.deleteFolder({ path: "folder", recursive: true });
    expect(res.success).toBe(true);
    expect(res.deletedFiles).toEqual([]);
  });

  it("deleteFolder recursive with undefined contents", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FolderOperations(client, config);
    const res = await ops.deleteFolder({ path: "folder/", recursive: true });
    expect(res.success).toBe(true);
    expect(res.deletedFiles).toEqual([]);
  });

  it("deleteFolder returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue("x") };
    const ops = new FolderOperations(client, config);
    const res = await ops.deleteFolder({ path: "folder", recursive: true });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Delete folder failed");
  });

  it("listFolders handles empty result and custom delimiter", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FolderOperations(client, config);
    const res = await ops.listFolders({ delimiter: "|" });
    expect(res.success).toBe(true);
    expect(res.folders).toEqual([]);
    expect(res.files).toEqual([]);
  });

  it("listFolders returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("lf boom")) };
    const ops = new FolderOperations(client, config);
    const res = await ops.listFolders();
    expect(res.success).toBe(false);
    expect(res.error).toBe("lf boom");
  });

  it("folderExists returns true via common prefixes", async () => {
    const client: any = {
      send: vi.fn().mockResolvedValue({ CommonPrefixes: [{ Prefix: "folder/" }] }),
    };
    const ops = new FolderOperations(client, config);
    const res = await ops.folderExists("folder/");
    expect(res.exists).toBe(true);
  });

  it("folderExists returns false when empty", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({}) };
    const ops = new FolderOperations(client, config);
    const res = await ops.folderExists("folder");
    expect(res.exists).toBe(false);
  });

  it("folderExists returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("fe boom")) };
    const ops = new FolderOperations(client, config);
    const res = await ops.folderExists("folder");
    expect(res.exists).toBe(false);
    expect(res.error).toBe("fe boom");
  });

  it("renameFolder returns empty when no contents", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ Contents: [] }) };
    const ops = new FolderOperations(client, config);
    const res = await ops.renameFolder({ oldPath: "old/", newPath: "new/" });
    expect(res.success).toBe(true);
    expect(res.movedFiles).toEqual([]);
  });

  it("renameFolder returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue(new Error("rf boom")) };
    const ops = new FolderOperations(client, config);
    const res = await ops.renameFolder({ oldPath: "old", newPath: "new" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("rf boom");
  });

  it("copyFolder returns empty when no contents", async () => {
    const client: any = { send: vi.fn().mockResolvedValue({ Contents: [] }) };
    const ops = new FolderOperations(client, config);
    const res = await ops.copyFolder({ sourcePath: "src/", destinationPath: "dest/" });
    expect(res.success).toBe(true);
    expect(res.copiedFiles).toEqual([]);
  });

  it("copyFolder returns error on throw", async () => {
    const client: any = { send: vi.fn().mockRejectedValue("x") };
    const ops = new FolderOperations(client, config);
    const res = await ops.copyFolder({ sourcePath: "src", destinationPath: "dest" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Copy folder failed");
  });
});
