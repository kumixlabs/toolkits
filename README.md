# Kumix Toolkits

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/bun-1.3.14-black)](https://bun.sh)

A collection of ready-to-use packages for modern application development. This monorepo includes reusable packages for email, storage, and common utilities.

## Packages

| Package                              | Version                                                                                                 | Description                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [@kumix/email](./packages/email)     | [![npm](https://img.shields.io/npm/v/@kumix/email.svg)](https://www.npmjs.com/package/@kumix/email)     | Email templates and sending utilities (Resend, Nodemailer)  |
| [@kumix/storage](./packages/storage) | [![npm](https://img.shields.io/npm/v/@kumix/storage.svg)](https://www.npmjs.com/package/@kumix/storage) | Unified storage interface (S3, Cloudinary, R2, MinIO, etc.) |
| [@kumix/utils](./packages/utils)     | [![npm](https://img.shields.io/npm/v/@kumix/utils.svg)](https://www.npmjs.com/package/@kumix/utils)     | Common utility functions for SaaS applications              |

## Tech Stack

- **Package Manager**: Bun
- **Monorepo Tool**: Turborepo
- **Build Tool**: tsdown
- **Linting/Formatting**: Biome
- **Language**: TypeScript

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3.14 or higher
- Node.js 24 or higher

### Installation

```bash
# Clone repository
git clone https://github.com/kumixlabs/toolkits.git
cd toolkits

# Install dependencies (Bun)
bun install
```

### Common Commands

```bash
# Development
bun run dev                # Run all packages (watch mode)
bun run build              # Build all packages
bun run types:check        # Type-check all packages

# Linting & Formatting (Biome)
bun run lint               # Lint with safe fixes
bun run lint:fix           # Lint with comprehensive fixes
bun run format             # Format code

# Testing
bun run test               # Run all tests
bun run test -- --run email  # Run one package's tests

# Maintenance
bun run clean              # Clean build outputs
bun run clean:all          # Deep clean (.turbo, bun.lock, node_modules)
```

### Working on Individual Packages

```bash
# Navigate to a specific package
cd packages/email          # or packages/storage, packages/utils

# Package commands
bun run dev                # Development mode (watch)
bun run build              # Build the package
bun run types:check        # Type-check the package
bun run test               # Test the package
```

## Development Workflow

1. **Create a branch** for your changes
2. **Make your changes** in the appropriate package(s)
3. **Run tests** and type-check: `bun run test && bun run types:check`
4. **Format your code**: `bun run format && bun run lint:fix`
5. **Commit your changes** following conventional commits
6. **Submit a pull request**

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Contributing

We welcome contributions! This project is community-driven and your help makes it better.

**Getting Started:**

- Read the [Contributing Guide](./CONTRIBUTING.md) for development setup and guidelines
- Check the [Code of Conduct](./CODE_OF_CONDUCT.md)
- Browse [open issues](https://github.com/kumixlabs/toolkits/issues) or start a [discussion](https://github.com/kumixlabs/toolkits/discussions)

## Security

If you discover a security vulnerability, please email **kumixdev@gmail.com**. All vulnerabilities will be addressed promptly.

Do not report security issues through public GitHub issues.

## License

MIT License — see [LICENSE](./LICENSE) for details.

By contributing to Kumix Toolkits, you agree that your contributions will be licensed under the MIT License.
