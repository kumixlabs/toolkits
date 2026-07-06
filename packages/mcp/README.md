# Kumix Toolkits - MCP Server

MCP server for exploring Kumix Toolkits packages, utilities, and documentation.

## Overview

This MCP server provides access to:

- **3 packages** in the Kumix Toolkits
- **Utility discovery** and search
- **Source code reading** for development
- **Usage examples** and documentation

## Available Packages

- `@kumix/email` - Email templates and sending utilities
  - **Exports**: Main, `/components`, `/helpers`
  - **Providers**: Resend, Nodemailer (SMTP)

- `@kumix/storage` - Storage abstraction for multiple providers
  - **Exports**: Main, `/s3`, `/cloudinary`, `/helpers`
  - **Providers**: AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Supabase, Cloudinary

- `@kumix/utils` - Comprehensive utility functions
  - **Exports**: Main, `/server` (Node.js only utilities)
  - **Categories**: string, url, datetime, crypto, validation, browser, array, analytics

## Setup

### Build

```bash
cd packages/mcp
bun run build
```

### Development

```bash
cd packages/mcp
bun run dev
```

### Testing

```bash
cd packages/mcp
bun run test
```

## Configuration

Add the MCP server to your MCP client configuration:

### Example Configuration

```json
{
  "mcpServers": {
    "Kumix Toolkits": {
      "command": "node",
      "args": ["/absolute/path/to/toolkits/packages/mcp/dist/index.js"],
      "cwd": "/absolute/path/to/toolkits"
    }
  }
}
```

### Configuration Parameters

- **command**: `"node"` - Runtime to execute the server
- **args**: Array containing the absolute path to the built server file
- **cwd**: Current working directory for the server process (repository root)

### Path Guidelines

**Finding the Correct Paths:**

1. **Path to `dist/index.js`**: The `args` array must contain the absolute path to the compiled MCP server
2. **Working Directory (`cwd`)**: Should point to the repository root where `packages/` is located

**Example Paths by Platform:**

```jsonc
// macOS/Linux
{
  "args": ["/home/user/projects/toolkits/packages/mcp/dist/index.js"],
  "cwd": "/home/user/projects/toolkits"
}

// Windows (with forward slashes - recommended)
{
  "args": ["C:/Users/user/projects/toolkits/packages/mcp/dist/index.js"],
  "cwd": "C:/Users/user/projects/toolkits"
}

// Windows (with backslashes - also works)
{
  "args": ["C:\\Users\\user\\projects\\toolkits\\packages\\mcp\\dist\\index.js"],
  "cwd": "C:\\Users\\user\\projects\\toolkits"
}
```

**Important Notes:**

- Use absolute paths (not relative paths)
- Paths must point to the **built** files in `dist/`, not source files
- The server must be built first: `cd packages/mcp && bun run build`
- Forward slashes work on all platforms and are recommended

## Available Tools

### 1. `list_packages`

Lists all available packages in the toolkits.

**Parameters:**

- `category` (optional): Filter by "email", "storage", "utils", or "all" (default: "all")

**Example Prompts:**

```
Show me all available packages.
List all email packages only.
What storage packages are available?
Show me the utils package.
```

### 2. `get_package_info`

Gets detailed information about a specific package.

**Parameters:**

- `package_name` (required): Full package name (e.g., "@kumix/email")

**Example Prompts:**

```
Tell me about the @kumix/email package.
What's in the storage package?
Show me details for @kumix/utils.
```

### 3. `find_component`

Searches for components across all packages.

**Parameters:**

- `component_name` (required): Name to search for
- `package_filter` (optional): Filter by package name

**Example Prompts:**

```
Find the slugify utility.
Search for "storage" functions.
Look for email components in the email package.
Find the resizeImage utility in the utils package.
```

### 4. `read_component_code`

Reads the source code of a specific component.

**Parameters:**

- `package_name` (required): Package containing the component
- `component_path` (required): Relative path from the package's src/ directory

**Example Prompts:**

```
Show me the code for EmailService in the email package.
Read the storage helper implementation.
Show me the slugify implementation in the utils package.
```

### 5. `get_usage_example`

Gets usage examples for packages or components.

**Parameters:**

- `package_name` (required): Package name
- `component_name` (optional): Specific component name

**Example Prompts:**

```
Give me usage examples for the email package.
How do I use the storage package?
Show me examples for the utils package.
```

## Usage Examples

### Exploring Packages

Use the tools to discover and explore available packages:

- List all packages with `list_packages`
- Get detailed information with `get_package_info`
- Find specific components with `find_component`
- Read source code with `read_component_code`
- Get usage examples with `get_usage_example`

## Common Workflows

### 1. Package Discovery

1. Use `list_packages` to see all available packages
2. Filter by category if needed (email/storage/utils)
3. Use `get_package_info` for detailed package information

### 2. Component Search and Analysis

1. Use `find_component` to locate relevant components
2. Use `read_component_code` to examine implementation
3. Use `get_usage_example` for usage patterns

### 3. Learning Patterns

1. Find a component type (e.g., forms, modals, tables)
2. Read multiple implementations
3. Analyze common patterns and best practices

## Tips for Best Results

### Be Specific with Names

- Use full package names: `@kumix/email` not just "email"
- Use exact component names when possible
- Include file extensions in component paths

### Combine Tools

- First `find_component`, then `read_component_code`
- Use `get_package_info` before `get_usage_example`
- Search across packages when unsure of location

### Understand the Structure

- **Email**: Email templates and sending utilities
- **Storage**: Storage abstraction for multiple providers
- **Utils**: Comprehensive utility functions
- Each package has its own `src/` directory with TypeScript files

## Troubleshooting

### Build Issues

1. **Build errors**
   - Run `bun run clean && bun run build`
   - Check TypeScript version
   - Verify all imports resolve correctly

2. **Path resolution**
   - Ensure working directory is correct
   - Check if packages have `src/` directories
   - Verify file paths are accessible

3. **Component access**
   - Use exact file paths from `src/` directory
   - Include file extension (.ts, .tsx, .js, .jsx)
   - Ensure component exists in the specified package

### Common Issues

1. **Empty package list**
   - Verify the MCP server executable exists at the configured path
   - Check if the dist/index.js file has been built (`bun run build` in packages/mcp)

2. **Package not found**
   - Use correct package names (e.g., `@kumix/email`, not `@kumix/toolkits.email`)
   - Available packages:
     - `@kumix/email`
     - `@kumix/storage`
     - `@kumix/utils`

## File Structure Reference

```
packages/
├── mcp/                  # MCP server (current directory)
│   ├── src/              # Source code
│   ├── dist/             # Built output
│   └── README.md         # This file
├── email/                # Email utilities package
│   ├── src/              # Source code
│   │   ├── components.ts # Email components
│   │   ├── helpers.ts    # Helper functions
│   │   ├── providers/    # Email providers
│   │   └── types.ts      # Type definitions
│   └── package.json
├── storage/              # Storage utilities package
│   ├── src/              # Source code
│   │   ├── s3.ts         # S3 provider
│   │   ├── cloudinary.ts # Cloudinary provider
│   │   ├── helpers.ts    # Helper functions
│   │   └── types.ts      # Type definitions
│   └── package.json
├── utils/                # General utilities package
│   ├── src/              # Source code
│   │   ├── server.ts     # Server-only utilities
│   │   ├── string/       # String utilities
│   │   ├── url/          # URL utilities
│   │   └── ...           # Other utility categories
│   └── package.json
└── ...
```

Each package contains:

- `src/` - Source code directory
- `package.json` - Package metadata
- TypeScript utilities and functions

## Development

### Build

```bash
bun run build
```

### Development Mode

```bash
bun run dev
```

### Type Checking

```bash
bun run types:check
```

### Clean Build

```bash
bun run clean && bun run build
```

## Getting Help

- Check this README.md for basic setup
- Examine existing components for implementation patterns
- Start with simple package exploration before complex searches
- Use the available tools to discover and explore packages
