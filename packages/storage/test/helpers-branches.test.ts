import { describe, expect, it } from "vitest";

import {
  base64ToBuffer,
  bufferToBase64,
  extractS3Info,
  generateFileHash,
  generateFileKey,
  generateUniqueKey,
  getFileExtension,
  getFileInfo,
  getFileName,
  getParentPath,
  parseS3Url,
  validateBucketName,
  validateS3Config,
  validateS3Key,
} from "../src/helpers";

describe("Helpers branch coverage", () => {
  it("generateFileKey without prefix uses whole name as base when no extension", () => {
    const key = generateFileKey("noext");
    expect(key).toMatch(/^noext-\d{13}-[a-z0-9]{6}$/);
  });

  it("getFileExtension for file without dot returns empty", () => {
    expect(getFileExtension("nodot")).toBe("");
  });

  it("validateS3Key rejects empty key", () => {
    expect(validateS3Key("").valid).toBe(false);
    expect(validateS3Key("").error).toContain("empty");
  });

  it("validateS3Key rejects overly long key", () => {
    const res = validateS3Key("a".repeat(1025));
    expect(res.valid).toBe(false);
    expect(res.error).toContain("1024");
  });

  it("validateS3Key rejects invalid characters", () => {
    const res = validateS3Key("bad key!");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("invalid characters");
  });

  it("getFileInfo uses provided type then falls back to mime", () => {
    const withType = getFileInfo(new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" }));
    expect(withType.type).toBe("image/jpeg");
    const noType = getFileInfo(new File([Buffer.from("a")], "b.pdf"));
    expect(noType.type).toBe("application/pdf");
  });

  it("generateUniqueKey without prefix", () => {
    const key = generateUniqueKey("file.txt", undefined, false);
    expect(key).toBe("file.txt");
  });

  it("extractS3Info returns empty for invalid url", () => {
    expect(extractS3Info("not a url")).toEqual({});
    expect(parseS3Url("not a url")).toEqual({});
  });

  it("extractS3Info handles custom endpoint", () => {
    const info = extractS3Info("https://minio.example.com/bucket/a/b.txt");
    expect(info.bucket).toBe("bucket");
    expect(info.key).toBe("a/b.txt");
    expect(info.region).toBeUndefined();
  });

  it("validateS3Config passes with full valid config", () => {
    const res = validateS3Config({
      provider: "aws",
      region: "us-east-1",
      bucket: "my-bucket",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it("validateS3Config flags invalid bucket name", () => {
    const res = validateS3Config({
      provider: "aws",
      region: "us-east-1",
      bucket: "Invalid_Bucket",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Invalid bucket name"))).toBe(true);
  });

  it("validateBucketName covers all rules", () => {
    expect(validateBucketName("").error).toContain("empty");
    expect(validateBucketName("ab").error).toContain("between 3 and 63");
    expect(validateBucketName("a".repeat(64)).error).toContain("between 3 and 63");
    expect(validateBucketName("UPPER").error).toContain("lowercase");
    expect(validateBucketName(".dotstart").error).toContain("start or end with a dot");
    expect(validateBucketName("dotend.").error).toContain("start or end with a dot");
    expect(validateBucketName("-hyphen").error).toContain("start or end with a hyphen");
    expect(validateBucketName("hyphen-").error).toContain("start or end with a hyphen");
    expect(validateBucketName("a..b").error).toContain("consecutive dots");
    expect(validateBucketName("valid-bucket").valid).toBe(true);
  });

  it("getParentPath and getFileName without slash", () => {
    expect(getParentPath("file.txt")).toBe("");
    expect(getFileName("file.txt")).toBe("file.txt");
    expect(getFileName("folder/sub/")).toBe("sub");
  });

  it("base64ToBuffer strips data url prefix", () => {
    const buffer = base64ToBuffer("data:text/plain;base64,SGVsbG8=");
    expect(buffer.toString()).toBe("Hello");
  });

  it("bufferToBase64 handles non-Buffer Uint8Array", () => {
    const bytes = new Uint8Array([72, 105]);
    const b64 = bufferToBase64(bytes);
    expect(b64).toBe(Buffer.from("Hi").toString("base64"));
  });

  it("generateFileHash sha1 uses subtle crypto", async () => {
    const sha1 = await generateFileHash(Buffer.from("Hello"), "sha1");
    expect(sha1).toMatch(/^[a-f0-9]{40}$/);
  });
});
