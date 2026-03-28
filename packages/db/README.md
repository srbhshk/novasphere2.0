# @novasphere/db

Database layer for novasphere: **Drizzle ORM** with a small driver factory so the same code can target **SQLite (file / libsql)**, **Neon**, or **Postgres** depending on `DATABASE_URL`.

---

## Install

From the monorepo root:

```bash
pnpm install
```

---

## Connection strings

```bash
# Local SQLite
DATABASE_URL=file:./dev.db

# Turso / libsql
DATABASE_URL=libsql://...

# Neon or standard Postgres
DATABASE_URL=postgres://...neon.tech/...
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

The client selects the driver from the URL prefix; application queries stay in Drizzle’s query builder.

---

## Scripts

Run via pnpm filter from the monorepo root:

```bash
pnpm --filter @novasphere/db build
pnpm --filter @novasphere/db db:push      # push schema (dev)
pnpm --filter @novasphere/db db:generate # generate migrations
pnpm --filter @novasphere/db db:migrate  # apply migrations
pnpm --filter @novasphere/db db:studio   # Drizzle Studio
```

Demo seed lives in `apps/web` (Better Auth boundary): `pnpm db:seed` or `pnpm --filter web seed:demo`.

Or use root shortcuts: `pnpm db:push`, `pnpm db:seed`, `pnpm db:studio`.

---

## Package boundaries

- **Must not** import any `ui-*` package, `agent-core`, or `tenant-core`.
- **May** be used by `tenant-core` and `apps/web`.

---

## Exports

`db` client, schema tables, migrations paths, and inferred types from `src/types.ts`—see `src/index.ts`.

---

## Extending

1. Add or change tables under `src/schema/`.
2. Export from the schema index and regenerate migrations with `db:generate` / `db:migrate` as appropriate.
3. Keep **tenant-scoped** queries in application code (`apps/web` or future services).
