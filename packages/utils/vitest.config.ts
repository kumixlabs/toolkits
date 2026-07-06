import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Aggregators / re-export barrels
        "src/functions/index.ts",
        "src/index.ts",
        "src/server.ts",
        // Browser DOM utilities requiring specific runtime APIs
        "src/functions/browser/construct-metadata.ts",
        "src/functions/browser/get-height.ts",
        "src/functions/browser/resize-image.ts",
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
