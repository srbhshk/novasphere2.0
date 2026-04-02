'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { betterAuthAdapter } from '@/lib/auth/better-auth-adapter'
import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'
import { DEMO_SEED_EMAILS, DEMO_SEED_PASSWORD } from '@/lib/demo-seed-credentials'

const LoginForm = dynamic(
  () => import('@novasphere/ui-auth').then((module) => module.LoginForm),
  { ssr: false },
)

export default function SignInView(): React.JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: sessionData } = useSession()
  const authSession = toAuthSession(sessionData ?? null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  return (
    <LoginForm
      adapter={betterAuthAdapter}
      className="p-5 sm:p-6"
      defaultValues={{ password: DEMO_SEED_PASSWORD }}
      rotatingEmailPlaceholders={DEMO_SEED_EMAILS}
      loading={isRedirecting}
      onSuccess={() => {
        setIsRedirecting(true)
        const returnTo = searchParams.get('returnTo')
        const tenantSlug = authSession?.tenantId ?? 'demo'
        const defaultTarget = `/${tenantSlug}/dashboard`
        router.replace(returnTo != null && returnTo.length > 0 ? returnTo : defaultTarget)
      }}
    />
  )
}
