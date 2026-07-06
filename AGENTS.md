# AGENTS.md

Bun monorepo — Kumix Toolkits. Turborepo orchestrates, Biome lints/formats, Vitest tests, Changesets releases. Requires Node >=24, Bun >=1.3.0 (`packageManager: bun@1.3.14`).

## Commands

```bash
bun run build          # turbo run build (dependsOn ^build) — tsdown per package (mcp: tsc)
bun run types:check    # turbo run types:check (dependsOn ^build — builds deps first, then tsc --noEmit)
bun run lint           # biome check (root, NOT turbo)
bun run lint:fix       # biome check --write --unsafe (root, NOT turbo)
bun run format         # biome format --write
bun run test           # turbo run test (dependsOn ^build)
bun run test:coverage  # turbo run test:coverage (dependsOn ^build)
bun run clean          # turbo run clean
bun run clean:all      # turbo run clean:all + rm -rf .turbo bun.lock .husky/_ node_modules

# Run a single package's tests (each package owns its vitest.config.ts):
cd packages/email && bun run test

# Or via turbo filter:
bun run test --filter @kumix/email
```

## Architecture

Published packages are ESM-only, `type: module`, built with **tsdown** (`dts: true`, config in `tsdown.config.ts`). `mcp` builds with **tsc**. (tsup is deprecated — do not reintroduce it.)

- **`packages/utils`** (`@kumix/utils`) — Client + server utilities. Exports `.` and `./server` (server-only: JWT `jsonwebtoken`, bcrypt `bcryptjs`, `node:crypto`). Main entry is cross-runtime; constants guard `process.env` via `typeof process`, browser fns have SSR guards.
- **`packages/email`** (`@kumix/email`) — Resend + Nodemailer. Exports `.`, `./components`, `./helpers`. Peers: `react >=18 || >=19-rc`, `react-email >=6.6`, `resend >=6.15`, `nodemailer >=9`. Resend + react/react-email loaded via dynamic `await import()` (so partial installs work); Nodemailer loaded via dynamic `await import()` too.
- **`packages/storage`** (`@kumix/storage`) — S3/R2/MinIO/Spaces/Supabase + Cloudinary. Exports `.`, `./s3`, `./cloudinary`, `./helpers`. **All peerDeps optional** (`@aws-sdk/*`, `cloudinary`). `./s3` and `./cloudinary` are Node-only; main + `./helpers` are cross-runtime (helpers use `Uint8Array` not `Buffer`, Web Crypto fallback for hashing).
- **`packages/mcp`** (`@kumix/mcp`) — Private MCP server, NOT published (`private: true`), built with `tsc`. `bun run test` here runs `node dist/index.js --test`, so build first.

### Cross-runtime `EnvRecord` pattern

Config/factory functions accept an optional `env?: EnvRecord` where `type EnvRecord = Record<string, string | undefined>`. On Node/Bun it defaults to `typeof process !== "undefined" ? process.env : undefined`. Other runtimes must pass env explicitly.

## Testing

- Each package owns its `vitest.config.ts` (include `test/**/*.test.ts`, `globals: true`, `setupFiles: ./test/setup.ts`). `environment` defaults to `"node"`; `utils` sets `jsdom` per-file via `// @vitest-environment jsdom` in browser tests.
- Root `test`/`test:coverage` run via **turbo** (`dependsOn: ["^build"]`), so `mcp` (which tests `node dist/index.js --test`) is built first. The published packages (utils/email/storage) test `src` directly via Vitest, so their build is only needed to satisfy the turbo dependency edge — not for test execution itself.
- Coverage thresholds enforced per package (email/utils: lines 90%, branches 85%). `utils` excludes coverage for browser DOM helpers (`construct-metadata`, `get-height`, `resize-image`) and aggregator barrels — see its `vitest.config.ts` exclude list before assuming a file is untested.

## Linting quirks

- Root `biome.jsonc` extends `@kumix/biome-config/base` and applies an `overrides` block that relaxes `noExplicitAny` for test files (`**/test/**`, `**/*.test.*`) — test code legitimately needs `as any` for invalid-config/throw assertions and provider mocks. All other Biome rules still apply to tests.
- Root `lint`/`lint:fix` invoke Biome directly (not turbo); no package defines a `lint` script.
- `lint-staged` config lives in root `package.json` (no separate file): JS/TS → `biome check --write`, MD/YAML → `prettier --write`, JSON/JSONC/HTML → `biome format --write`.

## Git hooks & commits

- Husky + lint-staged on pre-commit (`.husky/`).
- Commitlint (`.commitlintrc.cjs`): `@commitlint/config-conventional` + a custom `type-enum` override. Allowed types: `feat`, `feature`, `fix`, `refactor`, `docs`, `build`, `test`, `ci`, `chore`. (No `commitlint-plugin-function-rules`; header-max-length is config-conventional's default.)

## Publishing

```bash
bun run version   # changeset version && bun update
bun run release   # bash ./scripts/publish.sh — loops packages, skips private:true, `bun publish`, then `changeset tag`
```

- Changesets (`.changeset/config.json`): `baseBranch: main`, `commit: false` (no auto-commit), `access: public`, `bumpVersionsWithWorkspaceProtocolOnly: true`, `ignore: ["@kumix/mcp"]`.

## Workspace protocol

- Workspaces: `packages/*` and `apps/*` (no `apps/` dir yet).
- No Bun `catalog` — every package pins deps directly. `typescript` is `^6.0.3` everywhere; `@kumix/tsconfig` is the published `^0.1.0` (NOT `workspace:*` — there is no local `tsconfig` package here). Its configs are consumed via export subpaths: `@kumix/tsconfig/base`, `/bun`, `/node`, `/react`, etc. (not full filenames).
- `CLAUDE.md` intentionally defers here — AGENTS.md is the single source of truth.
