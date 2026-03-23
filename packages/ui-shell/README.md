# @novasphere/ui-shell

Application **chrome**: `AppShell`, sidebar, top bar, nav items, breadcrumbs. **Tenant-aware**; injects tenant accent color via CSS variables.

---

## Dependencies

- `@novasphere/tokens`, `@novasphere/ui-glass`, `@novasphere/tenant-core`, `@novasphere/ui-auth`

---

## Boundaries

- **Must not** import `ui-agent`, `ui-bento`, or `ui-charts` (shell stays unaware of dashboard content and copilot).

---

## Scripts

```bash
pnpm --filter @novasphere/ui-shell build
pnpm --filter @novasphere/ui-shell test
```

---

## Extending

Compose new routes in `apps/web` using `AppShell` and pass navigation/tenant props from server components or loaders. Motion/layout variants live in **`variants.ts`**.
