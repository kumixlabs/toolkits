import { describe, expect, it } from "vitest";

import { detectFileTypeFromContent, validateBatchFiles } from "../src/helpers";

describe("detectFileTypeFromContent all signatures", () => {
  it("detects GIF87a and GIF89a", () => {
    expect(detectFileTypeFromContent(Buffer.from("GIF87a....."))).toBe("image/gif");
    expect(detectFileTypeFromContent(Buffer.from("GIF89a....."))).toBe("image/gif");
  });

  it("detects WebP", () => {
    const riff = Buffer.from("RIFF");
    const size = Buffer.from([0, 0, 0, 0]);
    const webp = Buffer.from("WEBP");
    expect(detectFileTypeFromContent(Buffer.concat([riff, size, webp, Buffer.from("....")]))).toBe(
      "image/webp",
    );
  });

  it("detects ZIP based docx/xlsx/pptx/zip", () => {
    const zipSig = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const pad = Buffer.alloc(20);
    const docx = Buffer.concat([zipSig, Buffer.from("word/"), pad]);
    const xlsx = Buffer.concat([zipSig, Buffer.from("xl/"), pad]);
    const pptx = Buffer.concat([zipSig, Buffer.from("ppt/"), pad]);
    const zip = Buffer.concat([zipSig, Buffer.from("other/"), pad]);
    expect(detectFileTypeFromContent(docx)).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(detectFileTypeFromContent(xlsx)).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(detectFileTypeFromContent(pptx)).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    expect(detectFileTypeFromContent(zip)).toBe("application/zip");
  });

  it("detects MP4 via ftyp", () => {
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from("ftyp"), Buffer.alloc(8)]);
    expect(detectFileTypeFromContent(mp4)).toBe("video/mp4");
  });

  it("detects MP3 via frame sync and ID3", () => {
    const frame = Buffer.from([0xff, 0xe0, 0x00, 0x00]);
    expect(detectFileTypeFromContent(frame)).toBe("audio/mpeg");
    const id3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(8)]);
    expect(detectFileTypeFromContent(id3)).toBe("audio/mpeg");
  });

  it("detects plain text", () => {
    expect(detectFileTypeFromContent(Buffer.from("hello world plain text"))).toBe("text/plain");
  });

  it("returns octet-stream for binary with null byte", () => {
    const binary = Buffer.from([0x01, 0x00, 0x02, 0x99, 0xab, 0xcd]);
    expect(detectFileTypeFromContent(binary)).toBe("application/octet-stream");
  });

  it("validateBatchFiles rejects when exceeding maxFiles", () => {
    const files = [
      new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" }),
      new File([Buffer.from("b")], "b.jpg", { type: "image/jpeg" }),
    ];
    const results = validateBatchFiles(files, { maxFiles: 1 });
    expect(results.every((r) => !r.valid)).toBe(true);
    expect(results[0].errors![0]).toContain("Maximum 1 files allowed");
  });

  it("validateBatchFiles with no options passes all", () => {
    const files = [new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" })];
    const results = validateBatchFiles(files, {});
    expect(results[0].valid).toBe(true);
  });
});
