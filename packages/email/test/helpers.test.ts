import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addUtmParams,
  chunkEmails,
  deduplicateEmails,
  extractDisplayName,
  extractEmail,
  filterValidEmails,
  formatEmailAddress,
  formatFileSize,
  generatePreviewText,
  generateTrackingPixel,
  generateUnsubscribeLink,
  getMimeType,
  htmlToText,
  isValidEmail,
  parseEmailList,
  renderEmailTemplate,
  sanitizeHtml,
  truncateText,
  validateEmails,
} from "../src/helpers";

// Mock React Email render
vi.mock("react-email", () => ({
  render: vi.fn((template) => Promise.resolve("<html>mock-rendered-template</html>")),
}));

describe("Email Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Template Rendering", () => {
    it("should render React component to HTML", async () => {
      const TestComponent = ({ name }: { name: string }) =>
        React.createElement("div", null, `Hello ${name}`);

      const html = await renderEmailTemplate(TestComponent, { name: "John" });

      expect(typeof html).toBe("string");
      expect(html).toContain("mock-rendered-template");
    });
  });

  describe("HTML to Text Conversion", () => {
    it("should convert HTML to plain text", () => {
      const html = "<h1>Hello</h1><p>Welcome to our <strong>platform</strong>!</p>";
      const text = htmlToText(html);

      expect(text).toBe("Hello Welcome to our platform !");
    });

    it("should handle <br> tags correctly", () => {
      const html = "Line 1<br>Line 2<br/>Line 3";
      const text = htmlToText(html);

      expect(text).toBe("Line 1 Line 2 Line 3");
    });

    it("should handle paragraph breaks", () => {
      const html = "<p>Paragraph 1</p><p>Paragraph 2</p>";
      const text = htmlToText(html);

      expect(text).toBe("Paragraph 1 Paragraph 2");
    });

    it("should handle headings", () => {
      const html = "<h1>Title</h1><h2>Subtitle</h2><p>Content</p>";
      const text = htmlToText(html);

      expect(text).toContain("Title");
      expect(text).toContain("Subtitle");
      expect(text).toContain("Content");
    });

    it("should normalize whitespace", () => {
      const html = "<p>Text   with    extra     spaces</p>";
      const text = htmlToText(html);

      expect(text).toBe("Text with extra spaces");
    });

    it("should trim result", () => {
      const html = "  <p>Content</p>  ";
      const text = htmlToText(html);

      expect(text).toBe("Content");
    });
  });

  describe("Email Validation", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
      expect(isValidEmail("test.email@domain.org")).toBe(true);
      expect(isValidEmail("user123@test-domain.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user@.com")).toBe(false);
    });

    it("should validate multiple emails", () => {
      expect(validateEmails("user@example.com")).toBe(true);
      expect(validateEmails(["user1@example.com", "user2@example.com"])).toBe(true);
      expect(validateEmails(["valid@example.com", "invalid-email"])).toBe(false);
    });

    it("should filter valid emails from list", () => {
      const emails = ["valid@example.com", "invalid-email", "another@example.com"];
      const validEmails = filterValidEmails(emails);

      expect(validEmails).toEqual(["valid@example.com", "another@example.com"]);
    });

    it("should handle whitespace in email validation", () => {
      expect(isValidEmail(" user@example.com ")).toBe(false); // Should trim
      expect(validateEmails([" user@example.com ", "test@example.com"])).toBe(true);
    });
  });

  describe("Email Formatting", () => {
    it("should format email with display name", () => {
      const formatted = formatEmailAddress("John Doe", "john@example.com");
      expect(formatted).toBe("John Doe <john@example.com>");
    });

    it("should extract email from formatted address", () => {
      expect(extractEmail("John Doe <john@example.com>")).toBe("john@example.com");
      expect(extractEmail("simple@example.com")).toBe("simple@example.com");
    });

    it("should extract display name from formatted address", () => {
      expect(extractDisplayName("John Doe <john@example.com>")).toBe("John Doe");
      expect(extractDisplayName("Jane Smith <jane@example.com>")).toBe("Jane Smith");
      expect(extractDisplayName("simple@example.com")).toBe("");
    });

    it("should handle quoted display names", () => {
      expect(extractDisplayName('"John Doe" <john@example.com>')).toBe("John Doe");
    });
  });

  describe("Content Processing", () => {
    it("should sanitize HTML content", () => {
      const unsafeHtml = '<script>alert("xss")</script><p onclick="alert()">Safe content</p>';
      const safeHtml = sanitizeHtml(unsafeHtml);

      expect(safeHtml).not.toContain("<script>");
      expect(safeHtml).not.toContain("onclick");
      expect(safeHtml).toContain("<p>");
      expect(safeHtml).toContain("Safe content");
    });

    it("should remove javascript URLs", () => {
      const html = '<a href="javascript:alert()">Click</a><a href="https://example.com">Safe</a>';
      const safeHtml = sanitizeHtml(html);

      expect(safeHtml).not.toContain("javascript:");
      expect(safeHtml).toContain("https://example.com");
    });

    it("should truncate text with ellipsis", () => {
      const text = "This is a very long email subject line";
      const truncated = truncateText(text, 20);

      expect(truncated).toBe("This is a very lo...");
      expect(truncated.length).toBe(20);
    });

    it("should not truncate short text", () => {
      const text = "Short text";
      const truncated = truncateText(text, 20);

      expect(truncated).toBe("Short text");
    });

    it("should use custom ellipsis", () => {
      const text = "This is a very long email subject line";
      const truncated = truncateText(text, 20, " [more]");

      expect(truncated).toBe("This is a ver [more]");
    });

    it("should generate preview text from HTML", () => {
      const html = "<h1>Welcome!</h1><p>Thank you for joining our platform.</p>";
      const preview = generatePreviewText(html, 30);

      expect(preview).toBe("Welcome! Thank you for join...");
      expect(preview.length).toBe(30);
    });
  });

  describe("URL and Link Utilities", () => {
    it("should generate unsubscribe link", () => {
      const link = generateUnsubscribeLink(
        "https://example.com/unsubscribe",
        "user@example.com",
        "secure-token-123",
      );

      expect(link).toContain("https://example.com/unsubscribe");
      expect(link).toContain("email=user%40example.com");
      expect(link).toContain("token=secure-token-123");
    });

    it("should generate unsubscribe link without token", () => {
      const link = generateUnsubscribeLink("https://example.com/unsubscribe", "user@example.com");

      expect(link).toContain("email=user%40example.com");
      expect(link).not.toContain("token=");
    });

    it("should generate tracking pixel URL", () => {
      const pixelUrl = generateTrackingPixel("https://example.com/track", "email-123", "user-456");

      expect(pixelUrl).toContain("https://example.com/track");
      expect(pixelUrl).toContain("email_id=email-123");
      expect(pixelUrl).toContain("recipient_id=user-456");
      expect(pixelUrl).toContain("t=");
    });

    it("should add UTM parameters to URL", () => {
      const url = "https://example.com/product";
      const utmParams = {
        source: "email",
        medium: "newsletter",
        campaign: "summer_sale",
        content: "header_button",
      };

      const trackedUrl = addUtmParams(url, utmParams);

      expect(trackedUrl).toContain("utm_source=email");
      expect(trackedUrl).toContain("utm_medium=newsletter");
      expect(trackedUrl).toContain("utm_campaign=summer_sale");
      expect(trackedUrl).toContain("utm_content=header_button");
    });

    it("should handle URL with existing parameters", () => {
      const url = "https://example.com/product?existing=param";
      const utmParams = { source: "email" };

      const trackedUrl = addUtmParams(url, utmParams);

      expect(trackedUrl).toContain("existing=param");
      expect(trackedUrl).toContain("utm_source=email");
    });
  });

  describe("Email List Utilities", () => {
    it("should parse email list from string", () => {
      const emailString = "user1@example.com, user2@example.com; user3@example.com";
      const emails = parseEmailList(emailString);

      expect(emails).toEqual(["user1@example.com", "user2@example.com", "user3@example.com"]);
    });

    it("should handle mixed separators and whitespace", () => {
      const emailString = "  user1@example.com ,user2@example.com; user3@example.com  ";
      const emails = parseEmailList(emailString);

      expect(emails).toEqual(["user1@example.com", "user2@example.com", "user3@example.com"]);
    });

    it("should deduplicate email list", () => {
      const emails = ["user@example.com", "USER@EXAMPLE.COM", "other@example.com"];
      const unique = deduplicateEmails(emails);

      expect(unique).toEqual(["user@example.com", "other@example.com"]);
    });

    it("should chunk email list for batch sending", () => {
      const emails = ["user1@example.com", "user2@example.com", "user3@example.com"];
      const chunks = chunkEmails(emails, 2);

      expect(chunks).toEqual([["user1@example.com", "user2@example.com"], ["user3@example.com"]]);
    });

    it("should use default chunk size", () => {
      const emails = Array.from({ length: 250 }, (_, i) => `user${i}@example.com`);
      const chunks = chunkEmails(emails);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(100);
      expect(chunks[1]).toHaveLength(100);
      expect(chunks[2]).toHaveLength(50);
    });
  });

  describe("Attachment Utilities", () => {
    it("should get MIME type from file extension", () => {
      expect(getMimeType("document.pdf")).toBe("application/pdf");
      expect(getMimeType("image.jpg")).toBe("image/jpeg");
      expect(getMimeType("image.png")).toBe("image/png");
      expect(getMimeType(".gif")).toBe("image/gif");
    });

    it("should return default MIME type for unknown extensions", () => {
      expect(getMimeType("file.unknown")).toBe("application/octet-stream");
    });

    it("should handle case insensitive extensions", () => {
      expect(getMimeType("IMAGE.JPG")).toBe("image/jpeg");
      expect(getMimeType("Document.PDF")).toBe("application/pdf");
    });

    it("should format file size", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1.00 KB");
      expect(formatFileSize(1048576)).toBe("1.00 MB");
      expect(formatFileSize(1073741824, 1)).toBe("1.0 GB");
    });

    it("should handle different decimal places", () => {
      expect(formatFileSize(1536, 0)).toBe("2 KB");
      expect(formatFileSize(1536, 3)).toBe("1.500 KB");
    });

    it("should format large file sizes", () => {
      expect(formatFileSize(1099511627776)).toBe("1.00 TB"); // 1 TB
    });
  });
});
