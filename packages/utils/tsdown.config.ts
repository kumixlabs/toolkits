import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  publint: true,
  entry: ["./src/index.ts", "./src/server.ts"],
  format: "esm",
  target: "ES2022",
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  attw: { profile: "esm-only" },
});
