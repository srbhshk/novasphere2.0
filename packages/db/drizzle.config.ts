import type { Config } from 'drizzle-kit'
import { getDefaultSqliteDatabaseUrl } from './src/resolve-default-database-url'

const url = process.env['DATABASE_URL'] ?? getDefaultSqliteDatabaseUrl()
const isSqlite = url.startsWith('file:') || url.startsWith('libsql:')

export default {
  schema: './src/schema/index.ts',
  dialect: isSqlite ? 'sqlite' : 'postgresql',
  dbCredentials: { url },
  out: isSqlite ? './src/migrations/sqlite' : './src/migrations/postgres',
} satisfies Config
