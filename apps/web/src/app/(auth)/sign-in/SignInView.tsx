'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { betterAuthAdapter } from '@/lib/auth/better-auth-adapter'

const LoginForm = dynamic(
  () => import('@novasphere/ui-auth').then((module) => module.LoginForm),
  { ssr: false },
)

export default function SignInView(): React.JSX.Element {
  const router = useRouter()

  return (
    <LoginForm
      adapter={betterAuthAdapter}
      className="p-5 sm:p-6"
      onSuccess={() => {
        router.push('/demo/dashboard')
      }}
    />
  )
}
