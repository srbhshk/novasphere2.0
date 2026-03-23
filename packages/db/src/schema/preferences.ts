/**
 * User preferences — shapes GenUI personalisation per user.
 * These feed into AgentContext on every LLM call.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './auth'
import { organizations } from './tenant'

export const userPreferences = sqliteTable('user_preference', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // How Nova should address this user and what to prioritise
  aiPersona: text('ai_persona'),
  // e.g. 'board presentation' | 'daily standup' | 'investor review'
  dashboardGoal: text('dashboard_goal'),
  // JSON string — module IDs always shown regardless of LLM decision
  pinnedModuleIds: text('pinned_module_ids'),
  // JSON string — module IDs always hidden regardless of LLM decision
  hiddenModuleIds: text('hidden_module_ids'),
  // Named preset id: midnight-bloom | forest-ember | arctic-signal | obsidian-gold
  themePreset: text('theme_preset'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const layoutHistory = sqliteTable('layout_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // JSON string — full BentoLayoutConfig[] snapshot
  layoutJson: text('layout_json').notNull(),
  // What triggered this layout composition
  triggeredBy: text('triggered_by', {
    enum: ['user_message', 'anomaly', 'role_load', 'data_change'],
  }).notNull(),
  // The message that caused this layout (if user_message trigger)
  userMessage: text('user_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
