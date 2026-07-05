# AGENTS.md

Bun monorepo — Kumix Toolkits. Turborepo orchestrates, Biome lints/formats, Vitest tests, Changesets releases. Requires Node >=24, Bun >=1.3.0 (`packageManager: bun@1.3.14`).

## Commands

```bash
bun run build          # turbo run build (dependsOn ^build) — tsup per package
bun run types:check    # turbo run types:check (dependsOn ^build — builds deps first, then tsc --noEmit)
bun run lint           # biome check (root, NOT turbo)
bun run lint:fix       # biome check --write --unsafe (root, NOT turbo)
bun run format         # biome format --write
bun run test           # vitest run (root vitest.config.ts, NOT turbo)
bun run test:coverage  # vitest run --coverage (NOT turbo)
bun run clean          # turbo run clean
bun run clean:all      # turbo run clean:all + rm -rf .turbo bun.lock coverage node_modules

# Run a subset of tests (root test = `vitest run`, so pass a path/pattern filter):
bun run test -- packages/email        # only email package
bun run test -- packages/utils/test/foo.test.ts

# Or from a package directory:
cd packages/email && bun run test
```

## Architecture

Published packages are ESM-only, `type: module`, built with **tsdown** (`dts: true`, config in `tsdown.config.ts`). `mcp` builds with **tsc**. (tsup is deprecated — do not reintroduce it.)

- **`packages/utils`** (`@kumix/utils`) — Client + server utilities. Exports `.` and `./server` (server-only: JWT `jsonwebtoken`, bcrypt `bcryptjs`, `node:crypto`). Main entry is cross-runtime; constants guard `process.env` via `typeof process`, browser fns have SSR guards.
- **`packages/email`** (`@kumix/email`) — Resend + Nodemailer. Exports `.`, `./components`, `./helpers`. Peers: `react >=18 || >=19-rc`, `react-email >=6`, `resend >=6.9`, `nodemailer >=8`. Nodemailer loaded via dynamic `await import()`; Resend works everywhere.
- **`packages/storage`** (`@kumix/storage`) — S3/R2/MinIO/Spaces/Supabase + Cloudinary. Exports `.`, `./s3`, `./cloudinary`, `./helpers`. **All peerDeps optional** (`@aws-sdk/*`, `cloudinary`). `./s3` and `./cloudinary` are Node-only; main + `./helpers` are cross-runtime (helpers use `Uint8Array` not `Buffer`, Web Crypto fallback for hashing).
- **`packages/mcp`** (`@kumix/mcp.toolkits`) — Private MCP server, NOT published (`private: true`), built with `tsc`. `bun run test` here runs `node dist/index.js --test`, so build first.

### Cross-runtime `EnvRecord` pattern

Config/factory functions accept an optional `env?: EnvRecord` where `type EnvRecord = Record<string, string | undefined>`. On Node/Bun it defaults to `typeof process !== "undefined" ? process.env : undefined`. Other runtimes must pass env explicitly.

## Testing

- Root `vitest.config.ts` uses `projects: ["packages/*"]` — each package owns its `vitest.config.ts` (include `test/**/*.test.ts`, `environment: "node"`, `globals: true`, `setupFiles: ./test/setup.ts`).
- Coverage thresholds enforced per package (email/utils: lines 90%, branches 85%). `utils` excludes browser/http/analytics/datetime helpers from coverage — see its `vitest.config.ts` exclude list before assuming a file is untested.
- Root `test`/`test:coverage` run Vitest **directly, bypassing turbo** — no `^build` dependency. Vitest tests `src` directly, so no build needed for the published packages.

## Linting quirks

- Root `biome.jsonc` extends `@kumix/biome-config/base` and **excludes test dirs**: `"includes": ["!!**/test"]` — Biome does not touch test files.
- Root `lint`/`lint:fix` invoke Biome directly (not turbo); no package defines a `lint` script.
- `lint-staged` config lives in root `package.json` (no separate file): JS/TS → `biome check --write`, MD/YAML → `prettier --write`, JSON/JSONC/HTML → `biome format --write`.

## Git hooks & commits

- Husky + lint-staged on pre-commit (`.husky/`).
- Commitlint (`.commitlintrc.cjs`): `@commitlint/config-conventional` + `commitlint-plugin-function-rules`. Allowed types: `feat`, `feature`, `fix`, `refactor`, `docs`, `build`, `test`, `ci`, `chore`. `function-rules/header-max-length` disabled (no header length limit).

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
