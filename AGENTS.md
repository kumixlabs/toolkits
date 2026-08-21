# AGENTS.md

Bun monorepo for Kumix Toolkits. Turborepo handles task orchestration, Biome lints/formats, Vitest tests, Changesets versioning/publishing. Node >=24, Bun >=1.4.0.

## Monorepo Layout

- `packages/utils` (`@kumix/utils`): Utility functions (client + server exports).
- `packages/email` (`@kumix/email`): SaaS email template/sending helpers (Resend/Nodemailer dynamic imports).
- `packages/storage` (`@kumix/storage`): S3-compatible & Cloudinary abstraction.
- `packages/mcp` (`@kumix/mcp`): Private MCP server (`private: true`, built with `tsc`).

## Critical CLI Commands

Always run build/lint/typecheck/test before pushing (matching the CI gate sequence):

```bash
bun run build          # turbo build (tsdown per package; mcp uses tsc)
bun run lint           # biome check (root-level, no turbo caching)
bun run types:check    # turbo types:check (builds deps first, then tsc --noEmit)
bun run test           # turbo test (requires build step)
```

### Filtering & Specific Package Executions

- Single package test: `bun run test --filter @kumix/email` or `cd packages/email && bun run test`
- Lint fixes: `bun run lint:fix` (`biome check --write --unsafe` at root)

## Monorepo Quirks & Constraints

- **Dependency Pinning (Bun Catalog)**: `typescript` must use `catalog:` workspace syntax. Pin other dependencies individually per package.
- **ESM-Only**: Packages are `type: module`, compiled via `tsdown` to ESM-only outputs (except `@kumix/mcp` which targets raw Node). Do not reintroduce `tsup`.
- **Peer Dependencies**: `email` and `storage` peer dependencies (e.g. `react`, `@aws-sdk/*`, `cloudinary`) are explicitly listed as `optional` and dynamic-imported inside. Keep peer dependency packages unbundled by listing them in `deps.neverBundle` under each `tsdown.config.ts`.
- **Testing Exclusions & Coverage**:
  - Packages enforce `lines: 90` and `branches: 85` coverage thresholds.
  - Excluded paths in vitest configs (e.g. browser DOM functions in `utils` lacking Node/jsdom support during global runs) are skipped for coverage checks.
- **MCP Package Server Testing**: Testing the MCP server runs its built output directly (`node dist/index.js --test`). Build `@kumix/mcp` prior to running its test command.
- **Git Commit Convention**: Conventional Commits are enforced by Husky. Allowed scopes must match the pattern in `.commitlintrc.cjs`.
- **Release Steps**: Run `bun run version` (triggers changesets versioning) and then `bun run release` (executes `./scripts/publish.sh` to upload public packages and create tags).
- **Multi-Runtime Compatibility**: The packages (`utils`, `email`, `storage`) are structured to support diverse runtimes (Node, Bun, Deno, Cloudflare Workers/Edge). Cryptographic methods in `@kumix/utils` (e.g. `generateRandomString` and `generateSecurePassword`) utilize `globalThis.crypto.getRandomValues` instead of `node:crypto`. Node-specific APIs are dynamically imported or gated behind runtime checks to prevent module load failures in non-Node environments.
