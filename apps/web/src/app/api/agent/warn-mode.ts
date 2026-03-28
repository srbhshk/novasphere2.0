const WARN_MODE_DAYS = 21

export function getWarnModeStatus(now: number = Date.now()): {
  warnMode: boolean
  dayIndex: number
} {
  const sinceMs = now - Date.UTC(2026, 2, 24, 0, 0, 0, 0)
  const dayIndex = Math.floor(sinceMs / 86_400_000) + 1
  return { warnMode: dayIndex <= WARN_MODE_DAYS, dayIndex }
}
