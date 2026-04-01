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

import { createClient } from '@libsql/client'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { Pool } from 'pg'
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres'
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

export function getDb() {
  const url = resolveDatabaseUrl()

  if (url.startsWith('file:') || url.startsWith('libsql:')) {
    return drizzleLibsql(createClient({ url }), { schema })
  }

  if (url.includes('neon.tech')) {
    return drizzleNeonHttp(neon(url), { schema })
  }

  // Standard Postgres — Railway, Supabase, self-hosted
  return drizzleNodePostgres(new Pool({ connectionString: url }), { schema })
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
