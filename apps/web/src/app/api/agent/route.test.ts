import { describe, expect, it } from 'vitest'
import { getWarnModeStatus } from './warn-mode'

describe('agent contract warn mode window', () => {
  it('stays in warn mode within 21 days', () => {
    const start = Date.UTC(2026, 2, 24, 0, 0, 0, 0)
    const day10 = start + 9 * 86_400_000
    const status = getWarnModeStatus(day10)
    expect(status.warnMode).toBe(true)
    expect(status.dayIndex).toBe(10)
  })

  it('switches to enforce mode after 21 days', () => {
    const start = Date.UTC(2026, 2, 24, 0, 0, 0, 0)
    const day22 = start + 21 * 86_400_000
    const status = getWarnModeStatus(day22)
    expect(status.warnMode).toBe(false)
    expect(status.dayIndex).toBe(22)
  })
})
