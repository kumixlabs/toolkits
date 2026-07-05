import { describe, expect, it } from "vitest";

// Test that components export properly
describe("Email Components", () => {
  it("should re-export React Email components", async () => {
    const componentsModule = await import("../src/components");

    // Check that the module exports expected items
    expect(componentsModule).toBeDefined();

    // Check that ReactEmailComponents namespace exists
    expect(componentsModule.ReactEmailComponents).toBeDefined();

    // Check that common React Email components are exported
    const exportedNames = Object.keys(componentsModule);
    expect(exportedNames.length).toBeGreaterThan(0);
  });

  it("should export the ReactEmailComponents namespace", async () => {
    const { ReactEmailComponents } = await import("../src/components");

    expect(ReactEmailComponents).toBeDefined();
    expect(typeof ReactEmailComponents).toBe("object");
  });
});
