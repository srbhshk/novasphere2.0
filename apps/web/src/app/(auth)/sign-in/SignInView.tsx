'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { betterAuthAdapter } from '@/lib/auth/better-auth-adapter'

const LoginForm = dynamic(
  () => import('@novasphere/ui-auth').then((module) => module.LoginForm),
  { ssr: false },
)

export default function SignInView(): React.JSX.Element {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  return (
    <LoginForm
      adapter={betterAuthAdapter}
      className="p-5 sm:p-6"
      loading={isRedirecting}
      onSuccess={() => {
        setIsRedirecting(true)
        router.replace('/demo/dashboard')
      }}
    />
  )
}
