/**
 * TypeScript types inferred from Drizzle schema.
 * Import these throughout the application — never define
 * manual types that duplicate what Drizzle already provides.
 */

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type {
  accounts,
  layoutHistory,
  members,
  organizations,
  sessions,
  tenantConfigs,
  userPreferences,
  users,
  verifications,
} from './schema'

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Session = InferSelectModel<typeof sessions>
export type NewSession = InferInsertModel<typeof sessions>

export type Account = InferSelectModel<typeof accounts>
export type NewAccount = InferInsertModel<typeof accounts>

export type Verification = InferSelectModel<typeof verifications>
export type NewVerification = InferInsertModel<typeof verifications>

export type Organization = InferSelectModel<typeof organizations>
export type NewOrganization = InferInsertModel<typeof organizations>

export type Member = InferSelectModel<typeof members>
export type NewMember = InferInsertModel<typeof members>

export type TenantConfig = InferSelectModel<typeof tenantConfigs>
export type NewTenantConfig = InferInsertModel<typeof tenantConfigs>

export type UserPreference = InferSelectModel<typeof userPreferences>
export type NewUserPreference = InferInsertModel<typeof userPreferences>

export type LayoutHistory = InferSelectModel<typeof layoutHistory>
export type NewLayoutHistory = InferInsertModel<typeof layoutHistory>

export type UserRole = 'admin' | 'ceo' | 'engineer' | 'viewer'
export type TenantPlan = 'free' | 'pro' | 'enterprise'
export type LayoutTrigger = 'user_message' | 'anomaly' | 'role_load' | 'data_change'
