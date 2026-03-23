/**
 * novasphere — @novasphere/db
 * client: swappable Drizzle driver factory.
 *
 * DATABASE_URL prefix determines the driver automatically:
 *   file:// or libsql:// → @libsql/client  (SQLite / Turso)
 *   *neon.tech in URL    → @neondatabase/serverless (Neon)
 *   postgres://          → pg (standard Postgres)
 *
 * Zero query code changes when swapping drivers.
 */

import type * as LibsqlClientModule from '@libsql/client'
import type * as LibsqlDrizzleModule from 'drizzle-orm/libsql'
import type * as NeonModule from '@neondatabase/serverless'
import type * as NeonDrizzleModule from 'drizzle-orm/neon-http'
import type * as PgModule from 'pg'
import type * as PgDrizzleModule from 'drizzle-orm/node-postgres'
import { createRequire } from 'node:module'
import * as schema from './schema'
import { getDefaultSqliteDatabaseUrl } from './resolve-default-database-url'

/** Resolved DATABASE_URL — when unset, matches `apps/web` dev default (see getDefaultSqliteDatabaseUrl). */
export function resolveDatabaseUrl(): string {
  const raw = process.env['DATABASE_URL']
  if (typeof raw === 'string' && raw.length > 0) {
    return raw
  }

  return getDefaultSqliteDatabaseUrl()
}

const runtimeRequire = createRequire(import.meta.url)

function requireNodeModule(moduleName: string): unknown {
  return runtimeRequire(moduleName)
}

export function getDb() {
  const url = resolveDatabaseUrl()

  if (url.startsWith('file:') || url.startsWith('libsql:')) {
    const { createClient } = requireNodeModule(
      '@libsql/client',
    ) as typeof LibsqlClientModule
    const { drizzle } = requireNodeModule(
      'drizzle-orm/libsql',
    ) as typeof LibsqlDrizzleModule
    return drizzle(createClient({ url }), { schema })
  }

  if (url.includes('neon.tech')) {
    const { neon } = requireNodeModule('@neondatabase/serverless') as typeof NeonModule
    const { drizzle } = requireNodeModule(
      'drizzle-orm/neon-http',
    ) as typeof NeonDrizzleModule
    return drizzle(neon(url), { schema })
  }

  // Standard Postgres — Railway, Supabase, self-hosted
  const { Pool } = requireNodeModule('pg') as typeof PgModule
  const { drizzle } = requireNodeModule(
    'drizzle-orm/node-postgres',
  ) as typeof PgDrizzleModule
  return drizzle(new Pool({ connectionString: url }), { schema })
}

type DatabaseInstance = ReturnType<typeof getDb>

let cachedDb: DatabaseInstance | null = null

function getCachedDb(): DatabaseInstance {
  if (cachedDb == null) {
    cachedDb = getDb()
  }
  return cachedDb
}

// Lazy singleton proxy avoids eager DB connection setup during module evaluation.
export const db = new Proxy({} as DatabaseInstance, {
  get(_target, propertyKey, receiver) {
    const instance = getCachedDb()
    return Reflect.get(instance as object, propertyKey, receiver)
  },
}) as DatabaseInstance

export type Database = DatabaseInstance
