import type { BentoLayoutConfig } from '@novasphere/ui-bento'

const STORAGE_VERSION = 1

export function layoutStorageKey(userId: string, tenantId: string): string {
  return `ns_layout_v${STORAGE_VERSION}:${userId}:${tenantId}`
}

export function safeReadLayout(key: string): BentoLayoutConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BentoLayoutConfig) : null
  } catch {
    return null
  }
}

export function safeWriteLayout(key: string, layout: BentoLayoutConfig | null): void {
  if (typeof window === 'undefined') return
  try {
    if (layout == null) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, JSON.stringify(layout))
  } catch {
    // ignore quota / private mode
  }
}
