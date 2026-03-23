# @novasphere/agent-core

**Pure TypeScript** layer: agent types, **all system prompts** (`src/prompts.ts`), product/context types, and **adapter implementations** (Ollama, OpenAI, Claude, Mock) for health checks and metadata—not for wiring the Vercel AI SDK streaming API.

---

## Critical boundaries

- **Do not** import `ai`, `@ai-sdk/*`, React, or any `ui-*` package.
- **Do not** import `nova.config.ts` (that stays in `apps/web`).

Streaming chat and `ToolLoopAgent` live in **`apps/web`** only.

---

## Scripts

```bash
pnpm --filter @novasphere/agent-core build
pnpm --filter @novasphere/agent-core test
pnpm --filter @novasphere/agent-core typecheck
```

---

## Extending

- **Prompts:** edit `src/prompts.ts` only (no inline prompts in UI).
- **Adapters:** add or adjust files under `src/adapters/` and export via `adapter.factory.ts`.
- **Types:** `product.types.ts`, `context.types.ts`, `agent.types.ts` for shared contracts with `apps/web`.
