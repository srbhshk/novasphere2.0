# apps/web — novasphere reference application

Next.js 16.2.x (App Router, Turbopack for `next dev` and `next build`) application that composes every `@novasphere/*` package. This is the **reference implementation**, not a generic template to fork blindly—copy patterns, respect package boundaries.

---

## Role in the monorepo

- **Imports** `nova.config.ts` (repo root) via agent context and server code only—packages must not import it.
- **Owns** Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`), Better Auth, `proxy.ts` (session gate), API routes, Zustand stores, TanStack Query hooks.
- **Deploys** as standalone output (`next.config.ts`) inside Docker (`docker/Dockerfile`).

---

## Scripts

| Command          | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `pnpm dev`       | Next.js dev server (from root: `pnpm dev` runs `turbo --filter web dev`) |
| `pnpm build`     | Production build                                                         |
| `pnpm start`     | Run production server locally                                            |
| `pnpm typecheck` | `tsc --noEmit`                                                           |
| `pnpm lint`      | ESLint (flat config) on `src/` and `proxy.ts`                            |

---

## Environment

Copy from the example file:

```bash
cp .env.example .env.local
```

See root [README.md](../../README.md) for variable meanings. Server-side validation: `src/lib/env.ts`.

---

## Copilot debugging (DEBUG_AGENT)

To emit full-fidelity Copilot logs (including **full system prompts** and **untrimmed request/response**) to stdout:

1. Set `DEBUG_AGENT=true` in `.env.local`
2. Run the app (`pnpm dev`)

### What you’ll see in logs

- **Turn lifecycle**: `agent_timing_request_received`, `agent_timing_request_validated`, `agent_timing_context_built`, `agent_timing_ai_stream_created`, `agent_timing_stream_returned`
- **Tool contract** (when tools are expected): `contract_compliant` / `contract_violation`
- **Off-topic gate**: `agent_relevance_blocked` (the request is handled without tools)
- **Debug payloads** (only when `DEBUG_AGENT=true`):
  - `agent_debug_request_body_raw`
  - `agent_debug_context_built`
  - `agent_debug_system_prompt`
  - `agent_debug_stream_output_raw`

Security note: these logs can contain sensitive user content; do not enable in production unless your log pipeline is restricted.

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
| `proxy.ts`                           | Session gate (Node); injects identity headers for downstream routes                  |

---

## How to extend (this app)

- **Agent tools:** `src/lib/agent/genui/tools.ts` + registration in `nova-agent.ts` + executor wiring.
- **Copilot + chat:** `useChat` and Zustand in dashboard/copilot code; pass `UIMessage[]` into `@novasphere/ui-agent` `CopilotPanel`.
- **Layouts:** `layout.store.ts` + bento module map in dashboard components.
- **Auth:** only under `src/lib/auth/`; UI forms come from `@novasphere/ui-auth` with adapters.

For stack rules and boundaries, see the root README and `.cursor/rules/novasphere-rules.mdc`.
