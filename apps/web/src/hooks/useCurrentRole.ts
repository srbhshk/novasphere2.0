import { useMemo } from 'react'
import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'

export type AgentRole = 'admin' | 'ceo' | 'engineer' | 'viewer'

function normalizeRole(raw: string | undefined): AgentRole {
  if (raw === 'admin' || raw === 'ceo' || raw === 'engineer' || raw === 'viewer') {
    return raw
  }
  return 'viewer'
}

export type CurrentRoleResult = {
  role: AgentRole
  isPending: boolean
  userId: string
  tenantId: string
}

export function useCurrentRole(): CurrentRoleResult {
  const { data: sessionData, isPending } = useSession()
  const session = useMemo(() => toAuthSession(sessionData ?? null), [sessionData])

  return {
    role: normalizeRole(session?.role),
    isPending,
    userId: session?.userId ?? 'anonymous',
    tenantId: session?.tenantId ?? 'demo',
  }
}
