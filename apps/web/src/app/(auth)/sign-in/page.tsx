import type React from 'react'
import SignInView from './SignInView'
import { AmbientBackground, GrainOverlay } from '@novasphere/ui-glass'

export default function SignInPage(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <AmbientBackground />
      <GrainOverlay />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/60">Sign in to continue to Novasphere</p>
        </div>
        <SignInView />
      </div>
    </div>
  )
}
