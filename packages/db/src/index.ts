export { db, getDb } from './client'
export type { Database } from './client'
export * from './schema'
export * from './types'
export {
  getUserPreferenceByUserId,
  upsertUserThemePreset,
} from './user-preference-queries'
export type {
  UpsertUserThemePresetInput,
  UserPreferenceRow,
} from './user-preference-queries'
