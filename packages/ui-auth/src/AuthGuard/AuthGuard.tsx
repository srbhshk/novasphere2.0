'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import type { AuthAdapter } from '../auth.adapter.interface'
import type { AuthSession } from '../auth.types'

export type AuthGuardProps = {
  adapter: AuthAdapter
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

/**
 * Client-side only — server protection via middleware.ts.
 * Calls adapter.getSession() on mount and renders children when authenticated,
 * fallback when not, and optional loading state while resolving.
 */
export function AuthGuard({
  adapter,
  children,
  fallback = null,
  loading = null,
}: AuthGuardProps): React.JSX.Element {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined)

  useEffect(() => {
    adapter.getSession().then(setSession)
  }, [adapter])

  if (session === undefined) {
    return <>{loading}</>
  }
  if (session === null) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
