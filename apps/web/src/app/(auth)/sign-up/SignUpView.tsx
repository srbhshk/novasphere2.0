'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { betterAuthAdapter } from '@/lib/auth/better-auth-adapter'

const SignupForm = dynamic(
  () => import('@novasphere/ui-auth').then((module) => module.SignupForm),
  { ssr: false },
)

export default function SignUpView(): React.JSX.Element {
  const router = useRouter()

  return (
    <SignupForm
      adapter={betterAuthAdapter}
      onSuccess={() => {
        router.push('/demo/dashboard')
      }}
    />
  )
}
