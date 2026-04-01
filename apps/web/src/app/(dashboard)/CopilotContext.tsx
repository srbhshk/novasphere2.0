'use client'

import * as React from 'react'

import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'

import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'
import { useCopilotChatStore } from '@/store/copilot-chat.store'

type CopilotChatContextValue = {
  messages: UIMessage[]
  sendMessage: (opts: { text: string }) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  stop: () => void
  userName: string
}

const CopilotChatContext = React.createContext<CopilotChatContextValue | null>(null)

function normalizeAgentRole(
  role: string | undefined,
): 'admin' | 'ceo' | 'engineer' | 'viewer' {
  const r = role?.trim().toLowerCase()
  if (r === 'admin' || r === 'ceo' || r === 'engineer' || r === 'viewer') {
    return r
  }
  return 'viewer'
}

export function CopilotChatProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const { data: sessionData, isPending } = useSession()
  const authSession = React.useMemo(
    () => toAuthSession(sessionData ?? null),
    [sessionData],
  )

  // IMPORTANT: Better Auth may transiently report no session during navigation/refetch.
  // We must not clear chat state (or swap threads) during that transient window.
  const [lastSignedIn, setLastSignedIn] = React.useState<{
    userId: string
    tenantId: string
    role: 'admin' | 'ceo' | 'engineer' | 'viewer'
    userName: string
  } | null>(null)

  React.useEffect(() => {
    if (authSession == null) return
    setLastSignedIn({
      userId: authSession.userId,
      tenantId: authSession.tenantId,
      role: normalizeAgentRole(authSession.role),
      userName: authSession.name,
    })
  }, [authSession])

  const confirmedSignedOut = !isPending && authSession == null
  const effective = authSession
    ? {
        userId: authSession.userId,
        tenantId: authSession.tenantId,
        role: normalizeAgentRole(authSession.role),
        userName: authSession.name ?? 'User',
      }
    : lastSignedIn

  const userId = effective?.userId ?? 'anonymous'
  const tenantId = effective?.tenantId ?? 'demo'
  const agentRole = effective?.role ?? 'viewer'
  const userName = effective?.userName ?? 'User'

  const getStorageKey = useCopilotChatStore((s) => s.getStorageKey)
  const hydrateThread = useCopilotChatStore((s) => s.hydrateThread)
  const setThreadMessages = useCopilotChatStore((s) => s.setThreadMessages)

  // Keep transport stable across route changes so chat state persists across pages.
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
        headers: {
          'x-user-id': userId,
          'x-user-role': agentRole,
          'x-tenant-id': tenantId,
        },
      }),
    [userId, agentRole, tenantId],
  )

  const threadKey = React.useMemo(
    () => getStorageKey(userId, tenantId),
    [getStorageKey, tenantId, userId],
  )

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    id: threadKey,
  })

  const prevKeyRef = React.useRef<string | null>(null)

  // Rehydrate chat thread when the user or tenant changes.
  React.useEffect(() => {
    prevKeyRef.current = threadKey

    if (confirmedSignedOut) {
      // User is confirmed signed out. Clear in-memory messages (storage is cleared on explicit logout flows).
      setMessages([])
      return
    }

    const hydrated = hydrateThread(threadKey)
    setMessages(hydrated)
  }, [confirmedSignedOut, hydrateThread, setMessages, threadKey])

  // Persist messages to localStorage per user+tenant thread.
  React.useEffect(() => {
    if (confirmedSignedOut) return
    setThreadMessages(threadKey, messages)
  }, [confirmedSignedOut, messages, setThreadMessages, threadKey])

  const value = React.useMemo<CopilotChatContextValue>(
    () => ({ messages, sendMessage, status, stop, userName }),
    [messages, sendMessage, status, stop, userName],
  )

  return (
    <CopilotChatContext.Provider value={value}>{children}</CopilotChatContext.Provider>
  )
}

export function useCopilotChat(): CopilotChatContextValue {
  const ctx = React.useContext(CopilotChatContext)
  if (ctx == null) {
    throw new Error('useCopilotChat must be used within CopilotChatProvider')
  }
  return ctx
}
