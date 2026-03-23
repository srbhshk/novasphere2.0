# @novasphere/ui-bento

**Bento grid** layout engine: renders `BentoLayoutConfig[]` produced by the agent’s layout tools. Includes **Framer Motion** drag-to-reorder when enabled from product config.

---

## Dependencies

- `@novasphere/tokens`
- `@novasphere/ui-glass`

---

## Boundaries

- **Must not** import `ui-agent`, `ui-auth`, `ui-shell`, or `ui-charts`.

---

## Scripts

```bash
pnpm --filter @novasphere/ui-bento build
pnpm --filter @novasphere/ui-bento test
```

---

## Extending

- New card types: extend `bento.types.ts` and the dashboard **module renderer** in `apps/web` that maps `moduleId` → React nodes.
- Motion variants belong in **`variants.ts`** (avoid large inline variant objects in JSX).
