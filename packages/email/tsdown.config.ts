import { defineConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  clean: true,
  dts: true,
  publint: true,
  deps: {
    neverBundle: [...Object.keys(pkg.peerDependencies || {})],
  },
  entry: ["./src/index.ts", "./src/components.ts", "./src/helpers.ts"],
  format: "esm",
  target: "ES2022",
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  attw: { profile: "esm-only" },
});
