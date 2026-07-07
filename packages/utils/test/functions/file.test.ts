import { describe, expect, it } from "vitest";

import { formatFileSize } from "../../src/index";

describe("File", () => {
  it("formatFileSize should format sizes", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formatFileSize clamps sub-byte values to the B unit", () => {
    expect(formatFileSize(0.5)).toBe("0.5 B");
    expect(formatFileSize(1)).toBe("1 B");
  });

  it("formatFileSize handles negative values", () => {
    expect(formatFileSize(-1024)).toBe("-1 KB");
  });

  it("formatFileSize supports a decimal (1000) base", () => {
    expect(formatFileSize(1000, 2, 1000)).toBe("1 KB");
  });
});
