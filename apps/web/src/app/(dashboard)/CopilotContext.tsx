'use client'

import * as React from 'react'

import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { usePathname } from 'next/navigation'

import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'

type CopilotChatContextValue = {
  messages: UIMessage[]
  sendMessage: (opts: { text: string }) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
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
  const { data: sessionData } = useSession()
  const authSession = React.useMemo(
    () => toAuthSession(sessionData ?? null),
    [sessionData],
  )

  const userId = authSession?.userId ?? 'anonymous'
  const tenantId = authSession?.tenantId ?? 'demo'
  const agentRole = normalizeAgentRole(authSession?.role)
  const pathname = usePathname()

  // Keep transport stable across route changes so chat state persists across pages.
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
        headers: {
          'x-user-id': userId,
          'x-user-role': agentRole,
          'x-tenant-id': tenantId,
          'x-current-route': pathname,
        },
      }),
    [userId, agentRole, tenantId, pathname],
  )

  const { messages, sendMessage, status } = useChat({ transport })

  const value = React.useMemo<CopilotChatContextValue>(
    () => ({ messages, sendMessage, status }),
    [messages, sendMessage, status],
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
