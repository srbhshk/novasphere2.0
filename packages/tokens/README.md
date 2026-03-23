# @novasphere/tokens

Design token foundation for novasphere: **CSS custom properties** (`--ns-*`), Tailwind v4 `@theme` mapping, and optional **preset theme** entry points. **Zero runtime dependencies**, no React.

---

## Consumption

- **TypeScript:** `import { ... } from '@novasphere/tokens'` — token-related constants and helpers (see `src/index.ts`).
- **CSS:** import the structural variables, for example:
  - `@novasphere/tokens/tokens.css`
  - Preset themes such as `@novasphere/tokens/themes/midnight-bloom`, `forest-ember`, `arctic-signal`, `obsidian-gold`.

The web app maps these in `apps/web/src/styles/globals.css` with Tailwind v4 `@source` scanning `packages/ui-*/src/**`.

---

## Rules

- **All** semantic colors and radii that belong to the design system should live here—not hardcoded in feature components.
- Theme colors are exposed as **CSS variables**; chart code that cannot read CSS vars at runtime uses token **TypeScript** constants from this package (see `ui-charts`).

---

## Package boundaries

- **Must not** import any other `@novasphere/*` package.

---

## Extending

1. Add or adjust variables in `src/tokens.css` and related exports.
2. Update `tailwind.preset.ts` if new token namespaces need Tailwind utilities.
3. Add a new preset under `themes/` if you introduce a named theme variant.
