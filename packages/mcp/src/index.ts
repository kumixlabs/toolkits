#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { glob } from "glob";
import { z } from "zod";

// Get current directory for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Get the correct packages directory relative to this file
// This works regardless of where the server is run from
const PACKAGES_DIR = resolve(__dirname, "..", "..");

// Read this package's version at startup so the advertised server version
// stays in sync with package.json (avoids drift between the two). Reading the
// file at runtime keeps it outside `rootDir`/tsc's source graph.
let SERVER_VERSION = "0.0.0";
try {
  const pkgJsonPath = resolve(__dirname, "..", "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
  if (typeof pkgJson.version === "string") SERVER_VERSION = pkgJson.version;
} catch {
  // keep default
}

// Check for test flag
const isTestMode = process.argv.includes("--test");

if (isTestMode) {
  console.log("✅ MCP server executable test passed");
  process.exit(0);
}

interface ComponentInfo {
  name: string;
  package: string;
  path: string;
}

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  main: string;
  exports: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  srcDir: string | null;
  packageDir: string;
  componentFiles: string[];
  category: string;
}

// Package information cache
const packages = new Map<string, PackageInfo>();
// Components indexed by basename. Multiple files across packages can share a
// name (every package has index.ts, config.ts, helpers.ts, types.ts), so we
// store an array per name instead of overwriting on collision.
const components = new Map<string, ComponentInfo[]>();

class KumixToolkitsMCPServer {
  private async loadPackageInfo(): Promise<void> {
    try {
      // Scan packages directory (exclude node_modules and dist)
      const packageDirs = await glob(join(PACKAGES_DIR, "**/package.json"), {
        ignore: ["**/node_modules/**", "**/dist/**"],
        windowsPathsNoEscape: true,
      });

      // Get parent directories of all package.json files
      const allPackageDirs = packageDirs.map((pkgJsonPath) => dirname(pkgJsonPath));

      for (const packageDir of allPackageDirs) {
        const packageJsonPath = join(packageDir, "package.json");

        try {
          await access(packageJsonPath);
          const packageJsonContent = await readFile(packageJsonPath, "utf-8");
          const packageJson = JSON.parse(packageJsonContent);

          if (packageJson.name?.startsWith("@kumix/") && packageJson.name !== "@kumix/mcp") {
            // Check if package has src directory
            const srcDir = join(packageDir, "src");
            let componentFiles: string[] = [];
            let hasSrcDir = false;

            try {
              await access(srcDir);
              hasSrcDir = true;

              // Get all TypeScript/TSX files in src directory
              componentFiles = await glob(join(srcDir, "**/*.{ts,tsx}"), {
                windowsPathsNoEscape: true,
              });
            } catch (_error) {
              // Package doesn't have src directory (like config packages)
              hasSrcDir = false;
            }

            // Extract exported components/members from package.json exports
            const exports = Object.keys(packageJson.exports || {})
              .filter((key) => key !== "./package.json")
              .map((key) => key.replace("./", ""));

            const packageInfo: PackageInfo = {
              name: packageJson.name,
              version: packageJson.version,
              description: packageJson.description,
              main: packageJson.main,
              exports: exports,
              dependencies: packageJson.dependencies || {},
              devDependencies: packageJson.devDependencies || {},
              srcDir: hasSrcDir ? srcDir : null,
              packageDir, // Store package root directory
              componentFiles,
              category: this.getPackageCategory(packageJson.name),
            };

            packages.set(packageJson.name, packageInfo);

            // Index components only if src directory exists. Multiple files
            // (across packages) can share the same basename — append to the
            // existing array so `find_component index` returns every match
            // instead of just the last one seen.
            if (hasSrcDir) {
              for (const componentFile of componentFiles) {
                const componentName = basename(componentFile, extname(componentFile));
                const relativePath = relative(srcDir, componentFile).replace(/\\/g, "/");

                const list = components.get(componentName) ?? [];
                list.push({
                  name: componentName,
                  package: packageJson.name,
                  path: relativePath,
                });
                components.set(componentName, list);
              }
            }
          }
        } catch (error) {
          // A malformed package.json used to silently drop the entire package
          // from the listing with no signal. Surface the failure so it is
          // diagnosable instead.
          console.error(`Skipping ${packageJsonPath}:`, error);
        }
      }
    } catch (error) {
      console.error("Error loading package info:", error);
    }
  }

  private getPackageCategory(packageName: string): string {
    // Only categories that actually match packages in this workspace are
    // returned. The previous `config` and `toolkits` branches never matched
    // any real `@kumix/*` package, so clients filtering by them got empty
    // results — keep the enum (and filter) honest.
    if (packageName.includes("email")) return "email";
    if (packageName.includes("storage")) return "storage";
    if (packageName.includes("utils")) return "utils";
    return "other";
  }

  async listPackages(category: string = "all") {
    if (packages.size === 0) {
      await this.loadPackageInfo();
    }

    let filteredPackages = Array.from(packages.values());

    if (category !== "all") {
      filteredPackages = filteredPackages.filter((pkg) => pkg.category === category);
    }

    return {
      content: [
        {
          type: "text" as "text",
          text: JSON.stringify(
            {
              packages: filteredPackages.map((pkg) => ({
                name: pkg.name,
                version: pkg.version,
                description: pkg.description,
                category: pkg.category,
                exportsCount: pkg.exports.length,
              })),
              total: filteredPackages.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async getPackageInfo(packageName: string) {
    if (packages.size === 0) {
      await this.loadPackageInfo();
    }

    const pkg = packages.get(packageName);
    if (!pkg) {
      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                error: `Package ${packageName} not found`,
                availablePackages: Array.from(packages.keys()),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as "text",
          text: JSON.stringify(
            {
              // Surface a curated, sanitized subset of the cached package info.
              // Previously the raw cache entry was returned, leaking absolute
              // filesystem paths (`packageDir`, `srcDir`) and the full devDeps
              // list which isn't useful to clients.
              name: pkg.name,
              version: pkg.version,
              description: pkg.description,
              main: pkg.main,
              exports: pkg.exports,
              category: pkg.category,
              dependencies: pkg.dependencies,
              componentCount: pkg.componentFiles.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async findComponent(componentName: string, packageFilter?: string) {
    if (packages.size === 0) {
      await this.loadPackageInfo();
    }

    // Components are now keyed by basename with an array value (to handle
    // cross-package name collisions like `index.ts`). Flatten + filter.
    let matchingComponents: ComponentInfo[] = [];
    for (const [name, list] of components) {
      if (name.toLowerCase().includes(componentName.toLowerCase())) {
        matchingComponents.push(...list);
      }
    }

    if (packageFilter) {
      matchingComponents = matchingComponents.filter((comp) =>
        comp.package.includes(packageFilter),
      );
    }

    return {
      content: [
        {
          type: "text" as "text",
          text: JSON.stringify(
            {
              components: matchingComponents,
              total: matchingComponents.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async readComponentCode(packageName: string, componentPath: string) {
    if (packages.size === 0) {
      await this.loadPackageInfo();
    }

    const pkg = packages.get(packageName);
    if (!pkg) {
      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                error: `Package ${packageName} not found`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    // Handle packages without src directory (config packages)
    const baseDir = pkg.srcDir || pkg.packageDir;
    const fullPath = resolve(baseDir, componentPath);

    // Restrict to safe source extensions so this tool can't be used to read
    // arbitrary files (package.json, .env, lock files, etc.).
    const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
    if (!allowedExtensions.has(extname(fullPath).toLowerCase())) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Unsupported file type. Allowed extensions: ${[...allowedExtensions].join(", ")}`,
                package: packageName,
                requestedPath: componentPath,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    // Prevent path traversal. The previous `startsWith` check was prefix-based
    // and matched sibling directories whose name began with the same string
    // (e.g. `/.../packages/email` also matched `/.../packages/email-secret`).
    // Use a separator-aware comparison instead.
    const normalizedBase = resolve(baseDir);
    const isInsideBase = fullPath === normalizedBase || fullPath.startsWith(normalizedBase + sep);
    if (!isInsideBase) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: `Access denied: path escapes package directory`,
                package: packageName,
                requestedPath: componentPath,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    try {
      const code = await readFile(fullPath, "utf-8");

      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                package: packageName,
                component: componentPath,
                code,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (_error) {
      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                error: `Component file not found: ${componentPath}`,
                package: packageName,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  async getUsageExample(packageName: string, componentName?: string) {
    if (packages.size === 0) {
      await this.loadPackageInfo();
    }

    const pkg = packages.get(packageName);
    if (!pkg) {
      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                error: `Package ${packageName} not found`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    // Try to find README or examples
    const readmePath = pkg.srcDir
      ? join(pkg.srcDir, "..", "README.md")
      : join(pkg.packageDir, "README.md");

    try {
      await access(readmePath);
      const readme = await readFile(readmePath, "utf-8");

      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                package: packageName,
                component: componentName,
                readme,
                note: componentName
                  ? `Specific examples for ${componentName} not found. Showing package README.`
                  : "Package README and usage examples",
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (_error) {
      // Generate basic usage example
      const example = this.generateUsageExample(packageName, componentName);

      return {
        content: [
          {
            type: "text" as "text",
            text: JSON.stringify(
              {
                package: packageName,
                component: componentName,
                example,
                note: "Generated usage example",
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  private generateUsageExample(packageName: string, _componentName?: string): string {
    if (packageName.includes("email")) {
      return `// Email usage example
import { createEmail } from "${packageName}";

const email = createEmail({
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY!,
  from: { name: "My App", email: "noreply@myapp.com" },
});

// Plain-HTML send
await email.sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome!</h1>",
});

// React template send (requires react + react-email peers)
import { renderEmailTemplate } from "${packageName}/helpers";
const html = await renderEmailTemplate(WelcomeEmail, { name: "John" });
await email.sendEmail({ to: "user@example.com", subject: "Hi", html });`;
    }

    if (packageName.includes("storage")) {
      return `// Storage usage example
import { createS3 } from "${packageName}/s3";

const storage = createS3(undefined, {
  KUMIX_S3_PROVIDER: "aws",
  KUMIX_S3_REGION: "us-east-1",
  KUMIX_S3_BUCKET: "my-bucket",
  KUMIX_S3_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  KUMIX_S3_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
});

await storage.upload({ key: "file.txt", file: "Hello World" });
const dl = await storage.download({ key: "file.txt" });
const list = await storage.list({ prefix: "" });`;
    }

    if (packageName.includes("utils")) {
      return `// Utils usage example
import { slugify, nanoid, cuid } from "${packageName}";
import { generateJWT, hashPassword } from "${packageName}/server";

const id = nanoid();
const slug = slugify("Hello World");
const token = generateJWT({ userId: id, email: "u@x.com" }, process.env.JWT_SECRET!);
const hashed = await hashPassword("password123");`;
    }

    // Default fallback
    return `// Example usage for ${packageName}
// See the package README for available exports and API.`;
  }
}

// Create server instance. Version is sourced from package.json above so the
// advertised version stays in sync with the published package.
const server = new McpServer({
  name: "Kumix Toolkits",
  version: SERVER_VERSION,
});

// Instance of our business logic
const kumixServer = new KumixToolkitsMCPServer();

// Register tools using the new API
server.registerTool(
  "list_packages",
  {
    description: "List all available Kumix toolkits packages",
    inputSchema: {
      category: z
        .enum(["email", "storage", "utils", "other", "all"])
        .default("all")
        .describe("Filter packages by category"),
    },
  },
  async ({ category }) => {
    const result = await kumixServer.listPackages(category || "all");
    return result;
  },
);

server.registerTool(
  "get_package_info",
  {
    description: "Get detailed information about a specific package",
    inputSchema: {
      package_name: z
        .string()
        .min(1, "Package name is required")
        .describe("The name of the package (e.g., @kumix/email)"),
    },
  },
  async ({ package_name }) => {
    const result = await kumixServer.getPackageInfo(package_name);
    return result;
  },
);

server.registerTool(
  "find_component",
  {
    description: "Find a specific component in the packages",
    inputSchema: {
      component_name: z
        .string()
        .min(1, "Component name is required")
        .describe("The name of the component to find"),
      package_filter: z
        .string()
        .optional()
        .describe("Optional package to search in (e.g., email, storage, utils)"),
    },
  },
  async ({ component_name, package_filter }) => {
    const result = await kumixServer.findComponent(component_name, package_filter);
    return result;
  },
);

server.registerTool(
  "read_component_code",
  {
    description: "Read the source code of a specific component",
    inputSchema: {
      package_name: z
        .string()
        .min(1, "Package name is required")
        .describe("The package containing the component"),
      component_path: z
        .string()
        .min(1, "Component path is required")
        .describe("The relative path to the component from src/"),
    },
  },
  async ({ package_name, component_path }) => {
    const result = await kumixServer.readComponentCode(package_name, component_path);
    return result;
  },
);

server.registerTool(
  "get_usage_example",
  {
    description: "Get usage examples for a package or specific component",
    inputSchema: {
      package_name: z
        .string()
        .min(1, "Package name is required")
        .describe("The package to get examples for"),
      component_name: z.string().optional().describe("Optional specific component name"),
    },
  },
  async ({ package_name, component_name }) => {
    const result = await kumixServer.getUsageExample(package_name, component_name);
    return result;
  },
);

/**
 * Main entry point for the Kumix Toolkits MCP Server
 *
 * This script initializes the MCP server using the official MCP SDK and
 * provides tools and resources for exploring the toolkits packages.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kumix Toolkits MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
