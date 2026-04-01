import { create } from 'zustand'

const STORAGE_VERSION = 1

export type NotificationKind = 'anomaly' | 'system_alert' | 'deployment' | 'activity'

export type NotificationSeverity = 'info' | 'warning' | 'critical'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  severity: NotificationSeverity
  title: string
  description: string
  createdAt: number
  unread: boolean
  context?: {
    metricLabel?: string
    metricValue?: number
  }
}

function storageKeyForThread(userId: string, tenantId: string): string {
  return `ns_notifications_v${STORAGE_VERSION}:${userId}:${tenantId}`
}

function safeReadFromStorage(key: string): NotificationItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as NotificationItem[]
  } catch {
    return []
  }
}

function safeWriteToStorage(key: string, items: NotificationItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore quota / private mode
  }
}

function safeRemoveFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

type NotificationsStoreState = {
  activeKey: string | null
  itemsByKey: Record<string, NotificationItem[]>
  getStorageKey: (userId: string, tenantId: string) => string
  hydrate: (key: string) => NotificationItem[]
  upsertMany: (key: string, items: NotificationItem[]) => void
  markRead: (key: string, id: string) => void
  dismiss: (key: string, id: string) => void
  clearAll: (key: string) => void
}

export const useNotificationsStore = create<NotificationsStoreState>((set, get) => ({
  activeKey: null,
  itemsByKey: {},
  getStorageKey: (userId, tenantId) => storageKeyForThread(userId, tenantId),
  hydrate: (key) => {
    const existing = get().itemsByKey[key]
    if (existing) return existing
    const fromStorage = safeReadFromStorage(key)
    set((s) => ({ activeKey: key, itemsByKey: { ...s.itemsByKey, [key]: fromStorage } }))
    return fromStorage
  },
  upsertMany: (key, incoming) => {
    set((s) => {
      const current = s.itemsByKey[key] ?? []
      const byId = new Map(current.map((n) => [n.id, n]))
      for (const item of incoming) {
        const prev = byId.get(item.id)
        byId.set(
          item.id,
          prev
            ? {
                ...item,
                createdAt: prev.createdAt,
                unread: prev.unread,
              }
            : item,
        )
      }
      const next = [...byId.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50)
      safeWriteToStorage(key, next)
      return { activeKey: key, itemsByKey: { ...s.itemsByKey, [key]: next } }
    })
  },
  markRead: (key, id) => {
    set((s) => {
      const current = s.itemsByKey[key] ?? []
      const next = current.map((n) => (n.id === id ? { ...n, unread: false } : n))
      safeWriteToStorage(key, next)
      return { itemsByKey: { ...s.itemsByKey, [key]: next } }
    })
  },
  dismiss: (key, id) => {
    set((s) => {
      const current = s.itemsByKey[key] ?? []
      const next = current.filter((n) => n.id !== id)
      safeWriteToStorage(key, next)
      return { itemsByKey: { ...s.itemsByKey, [key]: next } }
    })
  },
  clearAll: (key) => {
    set((s) => {
      const next = { ...s.itemsByKey }
      delete next[key]
      safeRemoveFromStorage(key)
      return { itemsByKey: next, activeKey: s.activeKey === key ? null : s.activeKey }
    })
  },
}))
