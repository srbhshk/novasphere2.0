/**
 * Tenant schema — novasphere's own multi-tenancy tables.
 * All application queries must filter by organizationId.
 */

import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { users } from './auth'

export const organizations = sqliteTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan', { enum: ['free', 'pro', 'enterprise'] })
    .notNull()
    .default('free'),
  logoUrl: text('logo_url'),
  accentColor: text('accent_color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const members = sqliteTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', {
      enum: ['admin', 'ceo', 'engineer', 'viewer'],
    })
      .notNull()
      .default('viewer'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [unique().on(t.organizationId, t.userId)],
)

export const tenantConfigs = sqliteTable('tenant_config', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // JSON string — parsed by application layer into FeatureFlags
  features: text('features').notNull().default('{}'),
  // JSON string — parsed into TenantNavItem[]
  navItems: text('nav_items').notNull().default('[]'),
  // JSON string — GenUI preferences per org (optional)
  genuiPrefs: text('genui_prefs'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
