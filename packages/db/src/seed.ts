/**
 * Demo seed script.
 * Run with: pnpm --filter @novasphere/db db:seed
 * Creates repeatable demo data. Safe to run multiple times (upserts).
 */

import { hashPassword } from 'better-auth/crypto'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { db, resolveDatabaseUrl } from './client'
import type * as schema from './schema'
import {
  accounts,
  members,
  organizations,
  tenantConfigs,
  userPreferences,
  users,
} from './schema'

const now = new Date()

async function seed(): Promise<void> {
  const url = resolveDatabaseUrl()
  if (!url.startsWith('file:') && !url.startsWith('libsql:')) {
    throw new Error(
      '[novasphere/db] Seed only supports SQLite or libsql. Use a file: or libsql: DATABASE_URL.',
    )
  }

  // Safe: this seed script only runs against SQLite/libsql URLs (see runtime guard above).
  const sqliteDb = db as unknown as LibSQLDatabase<typeof schema>

  // Must match Better Auth's hasher (scrypt, `salt:key` hex) — not bcrypt.
  const defaultPasswordHash = await hashPassword('password')

  await sqliteDb
    .insert(organizations)
    .values({
      id: 'org_demo',
      name: 'novasphere Demo',
      slug: 'demo',
      plan: 'pro',
      accentColor: '#4f8ef7',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  await sqliteDb
    .insert(users)
    .values([
      {
        id: 'user_admin',
        name: 'Admin User',
        email: 'admin@demo.com',
        emailVerified: true,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user_ceo',
        name: 'CEO User',
        email: 'ceo@demo.com',
        emailVerified: true,
        role: 'ceo',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user_eng',
        name: 'Engineer User',
        email: 'eng@demo.com',
        emailVerified: true,
        role: 'engineer',
        createdAt: now,
        updatedAt: now,
      },
    ])
    .onConflictDoUpdate({
      target: users.id,
      set: {
        role: sql`excluded.role`,
        updatedAt: now,
      },
    })

  await sqliteDb
    .insert(accounts)
    .values([
      {
        id: 'account_admin',
        userId: 'user_admin',
        accountId: 'admin@demo.com',
        providerId: 'credential',
        password: defaultPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'account_ceo',
        userId: 'user_ceo',
        accountId: 'ceo@demo.com',
        providerId: 'credential',
        password: defaultPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'account_eng',
        userId: 'user_eng',
        accountId: 'eng@demo.com',
        providerId: 'credential',
        password: defaultPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .onConflictDoUpdate({
      target: accounts.id,
      set: {
        password: defaultPasswordHash,
        updatedAt: now,
      },
    })

  await sqliteDb
    .insert(members)
    .values([
      {
        id: 'member_admin',
        organizationId: 'org_demo',
        userId: 'user_admin',
        role: 'admin',
        createdAt: now,
      },
      {
        id: 'member_ceo',
        organizationId: 'org_demo',
        userId: 'user_ceo',
        role: 'ceo',
        createdAt: now,
      },
      {
        id: 'member_eng',
        organizationId: 'org_demo',
        userId: 'user_eng',
        role: 'engineer',
        createdAt: now,
      },
    ])
    .onConflictDoNothing()

  await sqliteDb
    .insert(tenantConfigs)
    .values({
      id: 'tenant_config_demo',
      organizationId: 'org_demo',
      features: JSON.stringify({
        bentoReorder: true,
        generativeLayout: true,
        multiTenant: true,
        authEnabled: true,
      }),
      navItems: JSON.stringify([
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'LayoutDashboard',
          href: '/dashboard',
        },
        { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
        { id: 'pipelines', label: 'Pipelines', icon: 'GitBranch', href: '/pipelines' },
        { id: 'agents', label: 'Agents', icon: 'Bot', href: '/agents' },
        { id: 'settings', label: 'Settings', icon: 'Settings2', href: '/settings' },
      ]),
      updatedAt: now,
    })
    .onConflictDoNothing()

  await sqliteDb
    .insert(userPreferences)
    .values([
      {
        id: 'pref_ceo',
        userId: 'user_ceo',
        organizationId: 'org_demo',
        aiPersona: 'executive',
        dashboardGoal: 'board presentation',
        updatedAt: now,
      },
      {
        id: 'pref_eng',
        userId: 'user_eng',
        organizationId: 'org_demo',
        aiPersona: 'engineer',
        dashboardGoal: 'system reliability',
        updatedAt: now,
      },
    ])
    .onConflictDoNothing()

  // eslint-disable-next-line no-console
  console.log('✓ Seeded: 1 org · 3 users · 3 members · 1 tenant config · 2 preferences')
}

void seed()
