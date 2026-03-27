import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { eq, type SQL } from 'drizzle-orm'
import { db } from './client'
import type * as schema from './schema'
import { userPreferences } from './schema/preferences'

export type UserPreferenceRow = typeof userPreferences.$inferSelect

/**
 * Loads a user's preference row for AgentContext.
 * `db` is typed as a union of libsql / neon / pg Drizzle instances; at runtime
 * exactly one driver is active. This wrapper keeps queries in @novasphere/db.
 */
export async function getUserPreferenceByUserId(
  userId: string,
): Promise<UserPreferenceRow | null> {
  /* One process = one Drizzle driver; `db` is typed as a driver union so `.from(sqliteTable)` is not expressible without narrowing. */
  const queryDb = db as unknown as {
    select: () => {
      from: (table: typeof userPreferences) => {
        where: (condition: SQL) => {
          limit: (n: number) => Promise<UserPreferenceRow[]>
        }
      }
    }
  }

  const rows = await queryDb
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)
  const first = rows[0]
  return first ?? null
}

export type UpsertUserThemePresetInput = {
  userId: string
  organizationId: string
  themePreset: string
}

export type UpsertUserDashboardGoalInput = {
  userId: string
  organizationId: string
  dashboardGoal: string
}

/**
 * Persists theme preset for a user. Uses SQLite/libsql driver shape (dev default).
 */
export async function upsertUserThemePreset(
  input: UpsertUserThemePresetInput,
): Promise<void> {
  const sqliteDb = db as unknown as LibSQLDatabase<typeof schema>
  const now = new Date()
  const existing = await getUserPreferenceByUserId(input.userId)
  if (existing != null) {
    await sqliteDb
      .update(userPreferences)
      .set({ themePreset: input.themePreset, updatedAt: now })
      .where(eq(userPreferences.userId, input.userId))
    return
  }

  await sqliteDb.insert(userPreferences).values({
    id: `pref_${input.userId}`,
    userId: input.userId,
    organizationId: input.organizationId,
    themePreset: input.themePreset,
    updatedAt: now,
  })
}

export async function upsertUserDashboardGoal(
  input: UpsertUserDashboardGoalInput,
): Promise<void> {
  const sqliteDb = db as unknown as LibSQLDatabase<typeof schema>
  const now = new Date()
  const existing = await getUserPreferenceByUserId(input.userId)
  if (existing != null) {
    await sqliteDb
      .update(userPreferences)
      .set({ dashboardGoal: input.dashboardGoal, updatedAt: now })
      .where(eq(userPreferences.userId, input.userId))
    return
  }

  await sqliteDb.insert(userPreferences).values({
    id: `pref_${input.userId}`,
    userId: input.userId,
    organizationId: input.organizationId,
    dashboardGoal: input.dashboardGoal,
    updatedAt: now,
  })
}
