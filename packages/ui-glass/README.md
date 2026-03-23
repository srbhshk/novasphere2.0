# @novasphere/ui-glass

**Liquid glass** visual primitives: `GlassCard`, `GlassPanel`, `GlassModal`, `AmbientBackground`, `GrainOverlay`, `Skeleton`, etc. Built on **`@novasphere/tokens`** and **shadcn/ui** primitives under `src/ui/`.

---

## shadcn/ui

- Generated shadcn files live in **`src/ui/`** — **do not edit** them directly.
- Extend behavior by **wrapping** in glass components or adjacent modules.

Adding new shadcn components: use the monorepo flow from project rules (`npx shadcn@latest ... --monorepo`) targeting this package’s `src/ui/`.

---

## Boundaries

- May import **`@novasphere/tokens` only** from novasphere (no `ui-bento`, `ui-agent`, `ui-auth`, `ui-shell`, `ui-charts`).

---

## Scripts

```bash
pnpm --filter @novasphere/ui-glass build
pnpm --filter @novasphere/ui-glass test
```

---

## Styling

Glass effects use **CSS Modules** next to components. Use **`cn()`** for Tailwind class composition; design values should come from tokens.
