/**
 * Shared utilities for deterministic mock data generation.
 * All functions are pure and produce the same output for the same input.
 */

// Linear congruential generator for deterministic pseudo-random numbers.
export function seededRandom(seed: number): number {
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32
  return ((a * seed + c) % m) / m
}

// Generate a deterministic float in [min, max) using a seed integer.
export function seedRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min)
}

// Generate a deterministic integer in [min, max] using a seed integer.
export function seedInt(seed: number, min: number, max: number): number {
  return Math.floor(seedRange(seed, min, max + 1))
}

// Generate a deterministic ISO date string offset from a base date.
export function isoOffset(baseDateMs: number, offsetDays: number): string {
  return new Date(baseDateMs + offsetDays * 86_400_000).toISOString()
}

// Human-friendly relative time string (deterministic).
export function relativeTime(offsetDays: number): string {
  if (offsetDays === 0) return 'Today'
  if (offsetDays === -1) return 'Yesterday'
  if (offsetDays > -7) return `${Math.abs(offsetDays)}d ago`
  if (offsetDays > -30) return `${Math.ceil(Math.abs(offsetDays) / 7)}w ago`
  return `${Math.ceil(Math.abs(offsetDays) / 30)}mo ago`
}

// Stable base date so all "now" references are deterministic in tests.
export const BASE_DATE_MS = new Date('2026-03-24T00:00:00.000Z').getTime()

// Build a sparkline of n points around a target value with deterministic jitter.
export function buildSparkline(
  baseValue: number,
  points: number,
  jitterPercent: number,
  seedOffset: number,
): number[] {
  return Array.from({ length: points }, (_, i) => {
    const r = seededRandom(seedOffset + i)
    const jitter = (r - 0.5) * 2 * jitterPercent * baseValue
    return Math.max(0, Math.round(baseValue + jitter))
  })
}

// Month labels going back n months from March 2026.
export function buildMonthLabels(count: number): string[] {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const result: string[] = []
  // Start month index for March 2026 = 2
  const baseMonth = 2
  const baseYear = 2026
  for (let i = count - 1; i >= 0; i--) {
    const totalMonth = baseMonth - i
    const month = ((totalMonth % 12) + 12) % 12
    const year = baseYear + Math.floor(totalMonth / 12)
    result.push(`${months[month]} '${String(year).slice(2)}`)
  }
  return result
}

// Build a deterministic heatmap (12 weeks x 7 days).
export function buildHeatmap(
  seedOffset: number,
): Array<{ week: number; day: 0 | 1 | 2 | 3 | 4 | 5 | 6; value: number }> {
  const cells: Array<{ week: number; day: 0 | 1 | 2 | 3 | 4 | 5 | 6; value: number }> = []
  const days = [0, 1, 2, 3, 4, 5, 6] as const
  for (let week = 0; week < 12; week++) {
    for (const day of days) {
      const seed = seedOffset + week * 7 + day
      cells.push({ week, day, value: Math.floor(seededRandom(seed) * 100) })
    }
  }
  return cells
}

export const FIRST_NAMES = [
  'Sarah',
  'Marcus',
  'Priya',
  'James',
  'Elena',
  'David',
  'Aisha',
  'Chris',
  'Yuki',
  'Tom',
  'Nadia',
  'Alex',
]

export const LAST_NAMES = [
  'Chen',
  'Williams',
  'Patel',
  'Kim',
  'Rodriguez',
  'Thompson',
  'Hassan',
  'Martinez',
  'Tanaka',
  'Anderson',
  'Johansson',
  'Osei',
]

export function fullName(seed: number): string {
  const first = FIRST_NAMES[seedInt(seed, 0, FIRST_NAMES.length - 1)] ?? 'Alex'
  const last = LAST_NAMES[seedInt(seed + 100, 0, LAST_NAMES.length - 1)] ?? 'Smith'
  return `${first} ${last}`
}

export const COMPANY_PREFIXES = [
  'Acme',
  'Zenith',
  'Apex',
  'Core',
  'Nexus',
  'Velo',
  'Stride',
  'Flux',
  'Echo',
  'Prism',
  'Orbit',
  'Forge',
  'Spark',
  'Shift',
  'Pulse',
]

export const COMPANY_SUFFIXES = [
  'Corp',
  'Inc',
  'Labs',
  'Systems',
  'Solutions',
  'Group',
  'Co',
  'Works',
  'Tech',
  'HQ',
  'IO',
  'AI',
]

export function companyName(seed: number): string {
  const pre = COMPANY_PREFIXES[seedInt(seed, 0, COMPANY_PREFIXES.length - 1)] ?? 'Acme'
  const suf =
    COMPANY_SUFFIXES[seedInt(seed + 50, 0, COMPANY_SUFFIXES.length - 1)] ?? 'Corp'
  return `${pre} ${suf}`
}
