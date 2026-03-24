'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import { betterAuthAdapter } from '@/lib/auth/better-auth-adapter'

const ForgotPasswordForm = dynamic(
  () => import('@novasphere/ui-auth').then((module) => module.ForgotPasswordForm),
  { ssr: false },
)

export default function ForgotPasswordView(): React.JSX.Element {
  return <ForgotPasswordForm adapter={betterAuthAdapter} className="p-5 sm:p-6" />
}
