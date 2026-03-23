# apps/web — novasphere reference application

Next.js 15 (App Router) application that composes every `@novasphere/*` package. This is the **reference implementation**, not a generic template to fork blindly—copy patterns, respect package boundaries.

---

## Role in the monorepo

- **Imports** `nova.config.ts` (repo root) via agent context and server code only—packages must not import it.
- **Owns** Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`), Better Auth, middleware, API routes, Zustand stores, TanStack Query hooks.
- **Deploys** as standalone output (`next.config.ts`) inside Docker (`docker/Dockerfile`).

---

## Scripts

| Command          | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `pnpm dev`       | Next.js dev server (from root: `pnpm dev` runs `turbo --filter web dev`) |
| `pnpm build`     | Production build                                                         |
| `pnpm start`     | Run production server locally                                            |
| `pnpm typecheck` | `tsc --noEmit`                                                           |
| `pnpm lint`      | ESLint on `src/` and `middleware.ts`                                     |

---

## Environment

Copy from the example file:

```bash
cp .env.example .env.local
```

See root [README.md](../../README.md) for variable meanings. Server-side validation: `src/lib/env.ts`.

---

## Directory map

| Path                                 | Purpose                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/app/`                           | Routes: `(auth)/`, `(dashboard)/[tenant]/dashboard/`, `api/`                         |
| `src/app/api/agent/route.ts`         | `ToolLoopAgent` streaming endpoint                                                   |
| `src/app/api/auth/[...all]/route.ts` | Better Auth handler                                                                  |
| `src/lib/agent/`                     | `nova-agent.ts`, `models.ts`, `context-builder.ts`, `genui/tools.ts`, tool execution |
| `src/lib/auth/`                      | Better Auth server + client                                                          |
| `src/store/`                         | Zustand: layout, agent, tenant                                                       |
| `src/hooks/`                         | TanStack Query data hooks                                                            |
| `middleware.ts`                      | Session; injects identity headers for downstream routes                              |

---

## How to extend (this app)

- **Agent tools:** `src/lib/agent/genui/tools.ts` + registration in `nova-agent.ts` + executor wiring.
- **Copilot + chat:** `useChat` and Zustand in dashboard/copilot code; pass `UIMessage[]` into `@novasphere/ui-agent` `CopilotPanel`.
- **Layouts:** `layout.store.ts` + bento module map in dashboard components.
- **Auth:** only under `src/lib/auth/`; UI forms come from `@novasphere/ui-auth` with adapters.

For stack rules and boundaries, see the root README and `.cursor/rules/novasphere-rules.mdc`.
