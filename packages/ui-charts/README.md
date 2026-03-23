# @novasphere/ui-charts

**Recharts v2** wrappers with glass styling: sparkline, donut, area, heatmap, plus loading/empty/error states. Typed chart data props only.

---

## Dependencies

- `@novasphere/tokens`
- `@novasphere/ui-glass`

**Note:** Recharts does not resolve CSS variables reliably for strokes/fills—use **token TypeScript constants** exported from this package where needed (see `chart.types.ts` and component files).

---

## Boundaries

- **Must not** import `ui-agent`, `ui-auth`, `ui-shell`, or `ui-bento`.

---

## Scripts

```bash
pnpm --filter @novasphere/ui-charts build
pnpm --filter @novasphere/ui-charts test
```

---

## Extending

Add a new chart component folder with a default export and named `Props` type; export from `src/index.ts`. Keep colors aligned with `@novasphere/tokens`.
