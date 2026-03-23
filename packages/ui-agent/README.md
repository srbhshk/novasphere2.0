# @novasphere/ui-agent

**Copilot panel** UI: messages, suggestion chips, typing indicator, adapter status badge/popover. Accepts **`UIMessage[]`**, **`sendMessage`**, and **`status`** via props—**no** `@ai-sdk/react` inside this package.

---

## Dependencies

- `@novasphere/tokens`, `@novasphere/ui-glass`, `@novasphere/agent-core` (types / copy only)

---

## Boundaries

- **Must not** import `ai`, `@ai-sdk/*`, `ui-auth`, `ui-shell`, `ui-bento`, or `ui-charts`.
- **`apps/web`** owns `useChat` and passes results down as props.

---

## Scripts

```bash
pnpm --filter @novasphere/ui-agent build
pnpm --filter @novasphere/ui-agent test
```

---

## Extending

Render logic for new message **part** types belongs in `AgentMessage/` and related components. Keep Framer Motion variants in **`variants.ts`**.
