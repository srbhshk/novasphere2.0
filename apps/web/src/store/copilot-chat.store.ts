import { create } from 'zustand'

import type { UIMessage } from 'ai'

const STORAGE_VERSION = 1

function storageKeyForThread(userId: string, tenantId: string): string {
  return `ns_chat_v${STORAGE_VERSION}:${userId}:${tenantId}`
}

function safeReadThreadFromStorage(key: string): UIMessage[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    // We intentionally do not deep-validate the AI SDK message shape here.
    // `useChat` will work with the stored payload; invalid entries are dropped.
    return parsed as UIMessage[]
  } catch {
    return null
  }
}

function safeWriteThreadToStorage(key: string, messages: UIMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(messages))
  } catch {
    // ignore quota / private mode
  }
}

function safeRemoveThreadFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

type CopilotChatStoreState = {
  activeKey: string | null
  threads: Record<string, UIMessage[]>
  getStorageKey: (userId: string, tenantId: string) => string
  hydrateThread: (key: string) => UIMessage[]
  setThreadMessages: (key: string, messages: UIMessage[]) => void
  clearThread: (key: string) => void
}

export const useCopilotChatStore = create<CopilotChatStoreState>((set, get) => ({
  activeKey: null,
  threads: {},
  getStorageKey: (userId, tenantId) => storageKeyForThread(userId, tenantId),
  hydrateThread: (key) => {
    const existing = get().threads[key]
    if (existing) return existing
    const fromStorage = safeReadThreadFromStorage(key)
    if (fromStorage) {
      set((s) => ({ threads: { ...s.threads, [key]: fromStorage } }))
      return fromStorage
    }
    return []
  },
  setThreadMessages: (key, messages) => {
    set((s) => ({
      activeKey: key,
      threads: { ...s.threads, [key]: messages },
    }))
    safeWriteThreadToStorage(key, messages)
  },
  clearThread: (key) => {
    set((s) => {
      const next = { ...s.threads }
      delete next[key]
      return { threads: next, activeKey: s.activeKey === key ? null : s.activeKey }
    })
    safeRemoveThreadFromStorage(key)
  },
}))
