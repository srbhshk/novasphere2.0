export { db, getDb, resolveDatabaseUrl } from './client'
export type { Database } from './client'
export * from './schema'
export * from './types'
export {
  getUserPreferenceByUserId,
  upsertUserDashboardGoal,
  upsertUserThemePreset,
} from './user-preference-queries'
export type {
  UpsertUserDashboardGoalInput,
  UpsertUserThemePresetInput,
  UserPreferenceRow,
} from './user-preference-queries'
