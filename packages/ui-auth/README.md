# @novasphere/ui-auth

Auth **UI only**: login, signup, forgot password, user menu, auth guard, tenant switcher. **Provider-agnostic** via the **`AuthAdapter`** interface—**Better Auth** is wired in **`apps/web`** only.

---

## Dependencies

- `@novasphere/tokens`, `@novasphere/ui-glass`, `@novasphere/tenant-core`

Forms use **React Hook Form + Zod** (`@hookform/resolvers/zod` is a runtime dependency).

---

## Boundaries

- **Must not** import `better-auth` or `apps/web`.
- **Must not** import `ui-agent`, `ui-shell`, `ui-bento`, or `ui-charts`.

---

## Scripts

```bash
pnpm --filter @novasphere/ui-auth build
pnpm --filter @novasphere/ui-auth test
```

---

## Extending

Implement adapter methods in `apps/web` and pass the adapter into these components. Add schemas under `schemas/` with Zod; keep label `htmlFor` matching input `id` for accessibility.
