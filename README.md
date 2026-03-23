# novasphere

A **domain-aware, AI-native dashboard framework**. The LLM is the controller; the composed UI is its output. Product context, user role, and live data together shape what users see—not a fixed tree of `if` statements.

This repository is a **pnpm + Turborepo monorepo**: shared libraries live under `packages/`, and the reference Next.js app lives under `apps/web/`. Authoritative architecture rules live in [`.cursor/rules/novasphere-rules.mdc`](.cursor/rules/novasphere-rules.mdc).

**License:** source-available, UNLICENSED until explicitly changed.

---

## What is implemented

| Area                 | What you get                                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product identity** | `nova.config.ts` at the repo root defines domain, metrics, terminology, and per-role context. Injected into the agent on every request (static import, no extra DB round-trip).                                                               |
| **Reference app**    | Next.js 16.2.x App Router (`apps/web`): landing page, sign-in/sign-up (Better Auth), tenant-scoped dashboard with bento layout, copilot panel, GenUI tools.                                                                                   |
| **AI**               | Vercel AI SDK 6: `ToolLoopAgent` in `apps/web/src/lib/agent/`, streaming chat, tools such as `render_layout`, `ask_clarification`, etc. Default model: Ollama with OpenAI-compatible API (`OLLAMA_BASE_URL` / `OLLAMA_MODEL`).                |
| **State**            | Zustand stores for layout, agent messages, tenant; `useChat` integrated with the agent store.                                                                                                                                                 |
| **Data**             | TanStack Query hooks in `apps/web/src/hooks/`; API routes for metrics, tenant, agent, auth.                                                                                                                                                   |
| **Database**         | `@novasphere/db`: Drizzle ORM, SQLite locally (`file:./dev.db`), swappable drivers via `DATABASE_URL`.                                                                                                                                        |
| **Multi-tenancy**    | `@novasphere/tenant-core`: tenant resolution and breadcrumbs; UI shell is tenant-aware.                                                                                                                                                       |
| **UI**               | Glass design system (`ui-glass`), bento grid (`ui-bento`), charts (`ui-charts`), auth UI (`ui-auth`), shell (`ui-shell`), copilot (`ui-agent`). shadcn/ui lives under `packages/ui-glass/src/ui/` (do not edit generated files—wrap instead). |
| **Production image** | Docker Compose: Next.js (standalone output) + Ollama; first start pulls the default model into a volume.                                                                                                                                      |

---

## Requirements

- **Node.js** ≥ 20.9 (required by Next.js 16)
- **pnpm** ≥ 9
- **Docker** (optional but recommended for the full stack demo)

---

## Quick start: Docker (demo / production-like)

One command runs the web app and Ollama. No local Node install required for this path.

```bash
cd /path/to/novasphere2.0
docker compose up
```

- App: [http://localhost:3000](http://localhost:3000)
- Ollama API (host): [http://localhost:11434](http://localhost:11434)

**First run:** the Ollama service pulls `qwen2.5:0.5b` (~400MB). **Later runs** reuse the `ollama_models` volume.

**Compose notes (see `docker-compose.yml`):**

- `OLLAMA_BASE_URL` for the web container is `http://ollama:11434` (Docker service name).
- `DATABASE_URL` uses an absolute SQLite path under `/app/data` with a persistent volume.
- Set a strong `BETTER_AUTH_SECRET` and correct `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` for real deployments.

Root scripts:

```bash
pnpm docker:demo    # docker compose up
pnpm docker:build   # docker compose build
```

---

## Development environment (step by step)

### 1. Install Ollama (local LLM)

Install from [https://ollama.com](https://ollama.com), then pull the default model:

```bash
ollama pull qwen2.5:0.5b
ollama serve   # if not already running as a service
```

### 2. Install JavaScript dependencies

From the monorepo root:

```bash
pnpm install
```

### 3. Environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`. Minimum for local dev:

| Variable              | Local dev typical value                                    |
| --------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000`                                    |
| `BETTER_AUTH_SECRET`  | Random string, **32+ characters**                          |
| `BETTER_AUTH_URL`     | Same as `NEXT_PUBLIC_APP_URL`                              |
| `DATABASE_URL`        | `file:./dev.db` (relative to `apps/web` when running Next) |
| `OLLAMA_BASE_URL`     | `http://localhost:11434`                                   |
| `OLLAMA_MODEL`        | `qwen2.5:0.5b`                                             |

Optional: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` for cloud models (wired in app code per project setup). `NEXT_PUBLIC_DATA_SOURCE` can be `mock` or `api`.

Validation: `apps/web/src/lib/env.ts` (Zod)—the app fails fast if required vars are missing.

### 4. Database (optional first run)

```bash
pnpm db:push    # drizzle-kit push — schema to SQLite
pnpm db:seed    # seed data if your package defines it
pnpm db:studio  # Drizzle Studio (optional)
```

### 5. Build packages (first time or after pulling)

Turborepo builds dependencies in order:

```bash
pnpm build
```

For day-to-day UI work on the app only, `pnpm dev` often suffices once packages are built; rebuild a package after changing its `src/` (`pnpm --filter @novasphere/<pkg> build` or root `pnpm build`).

### 6. Run the dev server

From the **monorepo root**:

```bash
pnpm dev
```

This runs `turbo --filter web dev` → Next.js with Turbopack. Open [http://localhost:3000](http://localhost:3000).

### 7. Quality checks

Single command matching CI (build, then typecheck, lint, and test across the monorepo):

```bash
pnpm verify
```

Individual tasks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check   # Prettier
```

**Formatting:** `pnpm format` writes Prettier output. Generated shadcn files under `packages/ui-glass/src/ui/` are excluded via `.prettierignore` to avoid churn.

**Turborepo:** `typecheck` runs after each workspace package’s `build` so `apps/web` has `next build` output (including `.next/types`) before `tsc --noEmit`.

**Git hooks (after `pnpm install`):**

- **pre-commit:** `lint-staged` runs Prettier on staged files (fast; avoids per-package ESLint config edge cases).
- **pre-push:** `pnpm verify` (full build, typecheck, lint, test).

**CI:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pushes and pull requests to `main`: `pnpm install --frozen-lockfile`, `pnpm verify`, `pnpm format:check`, and `docker compose build`. Enable branch protection on `main` and require this workflow to pass before merge.

**Local notes:** A `docs/` directory at the repo root is listed in `.gitignore` for private notes, analysis, and reports. End-to-end tests with Playwright are not wired yet; add a root `playwright.config.ts` and scripts when you introduce e2e coverage.

---

## Architecture overview

### Monorepo layout

```
novasphere/
├── nova.config.ts          # Product + theme + feature flags (app layer only)
├── apps/web/               # Next.js 16.2.x reference application (only app that imports nova.config)
├── packages/
│   ├── tokens/             # Design tokens, Tailwind v4 bridge
│   ├── db/                 # Drizzle, schemas, migrations
│   ├── agent-core/         # Prompts, adapters, types — NO ai SDK, NO React
│   ├── tenant-core/        # Tenant types + resolvers (uses db)
│   ├── ui-glass/           # Base glass UI + shadcn in src/ui/
│   ├── ui-bento/           # Bento grid / GenUI layout
│   ├── ui-charts/          # Recharts wrappers
│   ├── ui-auth/            # Auth UI (Better Auth only in apps/web)
│   ├── ui-agent/           # Copilot UI (props only — no @ai-sdk in package)
│   └── ui-shell/           # App shell, sidebar, topbar
├── docker/                 # Dockerfile + Ollama entrypoints
└── docker-compose.yml
```

### Dependency direction (strict)

Packages form a DAG. Examples:

- `tokens` → nothing else from novasphere.
- `agent-core` → no `ui-*`, no `ai`, no `@ai-sdk/*`.
- `apps/web` → may import all packages; **packages never import `apps/web`**.
- `nova.config.ts` is **only** imported from the app layer (e.g. `context-builder.ts`), never from `packages/*`.
- Better Auth is **only** in `apps/web/src/lib/auth/`.

Breaking these boundaries breaks the intended layering and CI expectations.

### Request flow (agent + dashboard)

1. User opens dashboard; copilot uses `useChat` (AI SDK 6) with messages stored in Zustand.
2. `POST /api/agent` runs `ToolLoopAgent` with tools defined in `apps/web/src/lib/agent/genui/tools.ts`.
3. `context-builder.ts` merges session headers, `novaConfig`, and tenant into instructions.
4. Tool calls (e.g. `render_layout`) are executed in the client/server bridge and update `layout.store` / UI.
5. Prompts and copy for adapters live in `packages/agent-core/src/prompts.ts` (not inlined in random components).

### Tech stack (approved)

| Layer            | Technology                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | Next.js 16.2.x, App Router, RSC by default, Turbopack (dev and build)  |
| Language         | TypeScript 5 (strict; no `any`)                                        |
| Styling          | Tailwind CSS v4, CSS Modules for glass; tokens in `@novasphere/tokens` |
| UI base          | shadcn/ui (in `ui-glass`); extend by wrapping                          |
| State            | Zustand v4                                                             |
| Server data      | TanStack Query v5 (`apps/web/src/hooks/`)                              |
| AI               | `ai` + `@ai-sdk/react` + `@ai-sdk/openai` (**apps/web only**)          |
| Auth             | Better Auth v1.5 (**apps/web only**)                                   |
| DB               | Drizzle + `@novasphere/db`                                             |
| Charts           | Recharts v2 in `ui-charts` only                                        |
| Motion           | Framer Motion v11 where listed as peer                                 |
| Build (packages) | tsup (CJS + ESM + types)                                               |
| Repo             | pnpm workspaces + Turborepo                                            |

---

## How to make changes safely

1. **Read boundaries** in [`.cursor/rules/novasphere-rules.mdc`](.cursor/rules/novasphere-rules.mdc) before adding imports or dependencies.
2. **Product / LLM behavior:** edit `nova.config.ts` and `packages/agent-core/src/prompts.ts` (never inline long prompts elsewhere).
3. **New tools for the agent:** add Zod schemas and tool definitions in `apps/web/src/lib/agent/genui/tools.ts`, register on the agent in `nova-agent.ts`, handle execution in `tool-executor` / dashboard code as needed.
4. **New UI modules in the bento:** extend the vocabulary the LLM can pass to `render_layout`/`render_component` and map `moduleId` to components in the dashboard module renderer.
5. **Design tokens:** add tokens in `packages/tokens` first; avoid magic colors in feature code.
6. **Database:** schema changes in `packages/db`, migrations via drizzle-kit; keep tenant scoping in mind.
7. **Published packages:** use [Changesets](https://github.com/changesets/changesets) (`pnpm changeset`) when versioning `@novasphere/*` packages.
8. **Tests:** Vitest + RTL per package; Playwright for e2e in the app. Follow project test rules (real shadcn components, `userEvent`, etc.).

---

## Extending for your product

1. **Replace the demo product** in `nova.config.ts` (`product`, `terminology`, `roleContext`, `primaryMetrics`, `criticalSignals`).
2. **Align theme** under `nova.config.ts` → `theme` and tokens for branding.
3. **Add or change dashboard modules** by wiring new bento cards and tool-capable `moduleId` values.
4. **Swap or add models** via `apps/web/src/lib/agent/models.ts` and env vars; Ollama remains the default for offline demos.
5. **Deploy** with Docker Compose or host Node 20+ with the same env contract as production; always set `OLLAMA_BASE_URL` from env (never hardcode Docker vs localhost).

---

## Package and app documentation

| Location                                                 | Purpose                                             |
| -------------------------------------------------------- | --------------------------------------------------- |
| [`apps/web/README.md`](apps/web/README.md)               | Next.js app layout, API routes, env, scripts        |
| [`packages/tokens/README.md`](packages/tokens/README.md) | Design tokens and themes                            |
| [`packages/db/README.md`](packages/db/README.md)         | Drizzle, drivers, DB scripts                        |
| Other `packages/*/README.md`                             | Per-package scope, boundaries, and extension points |

---

## Further reading

- **Cursor / AI rules:** `.cursor/rules/novasphere-rules.mdc`
- **Environment template:** `apps/web/.env.example`
