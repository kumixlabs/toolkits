import { describe, expect, it } from "vitest";
import { formatFileSize } from "../../src/index";

describe("File", () => {
  it("formatFileSize should format sizes", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});
