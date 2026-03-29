import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * When DATABASE_URL is unset, use the same SQLite file as `apps/web` (`file:./dev.db` from the web app cwd).
 * This keeps `pnpm db:seed` (web seed:demo) and API `getDb()` aligned without requiring env in every package script.
 */
export function getDefaultSqliteDatabaseUrl(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const monorepoRoot = join(here, '../../..')
  return pathToFileURL(join(monorepoRoot, 'apps/web/dev.db')).href
}
