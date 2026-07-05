import { describe, expect, it } from "vitest";

import {
  base64ToBuffer,
  bufferToBase64,
  buildPublicUrl,
  detectFileTypeFromContent,
  extractS3Info,
  generateBatchKeys,
  generateCacheControl,
  generateFileHash,
  generateFileKey,
  generateUniqueKey,
  getContentDisposition,
  getFileExtension,
  getFileName,
  getMimeType,
  getParentPath,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isVideoFile,
  joinPath,
  normalizePath,
  parseS3Url,
  sanitizeFileName,
  validateBatchFiles,
  validateBucketName,
  validateFileSize,
  validateFileType,
  validateS3Config,
  validateS3Key,
} from "../src/helpers";

describe("Storage Helpers - Advanced", () => {
  it("generateFileKey creates predictable format with prefix", () => {
    const key = generateFileKey("test.docx", "uploads");
    expect(key).toMatch(/^uploads\/test-\d{13}-[a-z0-9]{6}\.docx$/);
  });

  it("validateFileSize returns error when exceeding max", () => {
    const result = validateFileSize(10 * 1024 * 1024, 5 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("validateFileType supports mime wildcards and extensions", () => {
    const ok1 = validateFileType("photo.jpg", ["image/*", "application/pdf"]);
    const ok2 = validateFileType("file.pdf", [".pdf"]);
    const bad = validateFileType("file.exe", ["image/*", ".pdf"]);
    expect(ok1.valid).toBe(true);
    expect(ok2.valid).toBe(true);
    expect(bad.valid).toBe(false);
  });

  it("sanitizeFileName removes special chars and lowercases", () => {
    const sanitized = sanitizeFileName("My File (2025)#.PDF");
    expect(sanitized).toBe("my_file_2025_.pdf");
  });

  it("getFileExtension returns lowercased extension with dot", () => {
    expect(getFileExtension("photo.JPEG")).toBe(".jpeg");
    expect(getFileExtension("noext")).toBe(".noext");
  });

  it("generateCacheControl builds correct header", () => {
    expect(generateCacheControl()).toBe("public, max-age=31536000");
    expect(generateCacheControl(3600, false)).toBe("private, max-age=3600");
  });

  it("parseS3Url extracts bucket and key for various formats", () => {
    const vhost = parseS3Url("https://my-bucket.s3.us-east-1.amazonaws.com/folder/file.pdf");
    const path = parseS3Url("https://s3.us-east-1.amazonaws.com/my-bucket/folder/file.pdf");
    const custom = parseS3Url("https://endpoint.example.com/my-bucket/folder/file.pdf");
    expect(vhost.bucket).toBe("my-bucket");
    expect(vhost.key).toBe("folder/file.pdf");
    expect(path.bucket).toBe("my-bucket");
    expect(path.key).toBe("folder/file.pdf");
    expect(custom.bucket).toBe("my-bucket");
    expect(custom.key).toBe("folder/file.pdf");
  });

  it("buildPublicUrl constructs url from base and bucket", () => {
    const url = buildPublicUrl("https://cdn.example.com/", "assets", "images/logo.png");
    expect(url).toBe("https://cdn.example.com/assets/images/logo.png");
  });

  it("validateS3Key enforces naming rules", () => {
    expect(validateS3Key("valid/path/file.txt").valid).toBe(true);
    const invalid = validateS3Key("/bad/");
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("forward slash");
  });

  it("base64ToBuffer and bufferToBase64 round-trip", () => {
    const original = "Hello World";
    const base64 = bufferToBase64(Buffer.from(original));
    const buffer = base64ToBuffer(base64);
    expect(buffer.toString()).toBe(original);
  });

  it("bufferToBase64 requires mime when including data URL", () => {
    const buffer = Buffer.from("x");
    expect(() => bufferToBase64(buffer, true)).toThrow("MIME type is required");
    const url = bufferToBase64(buffer, true, "text/plain");
    expect(url.startsWith("data:text/plain;base64,")).toBe(true);
  });

  it("generateUniqueKey respects timestamp option", () => {
    const withTs = generateUniqueKey("file.txt", "docs", true);
    const withoutTs = generateUniqueKey("file.txt", "docs", false);
    expect(withTs).toMatch(/^docs\/file-\d{13}-[a-z0-9]{6}\.txt$/);
    expect(withoutTs).toBe("docs/file.txt");
  });

  it("extractS3Info extracts bucket, key, and region", () => {
    const info1 = extractS3Info("https://my-bucket.s3.us-west-2.amazonaws.com/a/b.txt");
    const info2 = extractS3Info("https://s3.eu-central-1.amazonaws.com/my-bucket/a.txt");
    expect(info1.bucket).toBe("my-bucket");
    expect(info1.key).toBe("a/b.txt");
    expect(info1.region).toBe("us-west-2");
    expect(info2.bucket).toBe("my-bucket");
    expect(info2.key).toBe("a.txt");
    expect(info2.region).toBe("eu-central-1");
  });

  it("validateS3Config finds missing fields", () => {
    const result = validateS3Config({ provider: "aws" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validateBucketName validates constraints", () => {
    expect(validateBucketName("my.valid-bucket").valid).toBe(true);
    const invalid = validateBucketName("Invalid_Bucket");
    expect(invalid.valid).toBe(false);
  });

  it("getContentDisposition builds header", () => {
    const header = getContentDisposition('name-"x".pdf', "inline");
    expect(header).toBe('inline; filename="name-x.pdf"');
  });

  it("file type helpers detect categories", () => {
    expect(isImageFile("photo.jpg")).toBe(true);
    expect(isVideoFile("movie.mp4")).toBe(true);
    expect(isAudioFile("sound.mp3")).toBe(true);
    expect(isDocumentFile("report.pdf")).toBe(true);
  });

  it("path helpers normalize and join paths", () => {
    expect(normalizePath("\\a\\\\b/c//")).toBe("a/b/c");
    expect(joinPath("/a/", "/b/", "/c/")).toBe("a/b/c");
    expect(getParentPath("a/b/c.txt")).toBe("a/b");
    expect(getFileName("a/b/c.txt")).toBe("c.txt");
  });

  it("generateFileHash computes hashes", async () => {
    const md5 = await generateFileHash(Buffer.from("Hello"), "md5");
    const sha256 = await generateFileHash("Hello", "sha256");
    expect(md5).toMatch(/^[a-f0-9]{32}$/);
    expect(sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generateBatchKeys creates keys per file", () => {
    const keys = generateBatchKeys(["a.pdf", "b.jpg"], "uploads");
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^uploads\/a-\d{13}-[a-z0-9]{6}\.pdf$/);
  });

  it("validateBatchFiles enforces max files and per-file rules", () => {
    const files = [
      new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" }),
      new File([Buffer.alloc(6 * 1024 * 1024)], "b.pdf", { type: "application/pdf" }),
    ];
    const results = validateBatchFiles(files, {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ["image/*", "application/pdf"],
      maxFiles: 10,
    });
    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
  });

  it("detectFileTypeFromContent identifies common types", () => {
    const pdfHeader = Buffer.from("%PDF-");
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectFileTypeFromContent(pdfHeader)).toBe("application/pdf");
    expect(detectFileTypeFromContent(jpegHeader)).toBe("image/jpeg");
    expect(detectFileTypeFromContent(pngHeader)).toBe("image/png");
    expect(detectFileTypeFromContent(Buffer.alloc(0))).toBe("application/octet-stream");
  });

  it("getPublicUrl uses endpoint or publicUrl when provided", () => {
    const url1 = buildPublicUrl("https://cdn.example.com", "bucket", "a/b.txt");
    const url2 = buildPublicUrl("https://endpoint.example.com", "bucket", "a/b.txt");
    expect(url1).toBe("https://cdn.example.com/bucket/a/b.txt");
    expect(url2).toBe("https://endpoint.example.com/bucket/a/b.txt");
  });

  it("getMimeType returns defaults for unknown", () => {
    expect(getMimeType("unknown.xyz")).toBe("chemical/x-xyz");
  });
});
