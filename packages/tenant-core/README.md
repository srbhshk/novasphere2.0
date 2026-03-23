# @novasphere/tenant-core

Multi-tenancy helpers: **tenant types**, DB-backed **tenant resolver**, and **breadcrumb** resolution. Pure TypeScript—no React, no CSS.

---

## Dependencies

- Depends on **`@novasphere/db`** for persisted tenant data.
- When no database is configured, behavior falls back to documented static defaults (see source).

---

## Boundaries

- **Must not** import any `ui-*` package or `agent-core`.

---

## Scripts

```bash
pnpm --filter @novasphere/tenant-core build
pnpm --filter @novasphere/tenant-core test
```

---

## Extending

- Adjust resolution rules in `tenant.resolver.ts` / `breadcrumb.resolver.ts` as your deployment model evolves.
- UI that switches tenants uses `@novasphere/ui-auth` **TenantSwitcher** with data supplied from `apps/web`.
