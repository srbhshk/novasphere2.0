import type React from 'react'
import SignUpView from './SignUpView'
import { AmbientBackground, GrainOverlay } from '@novasphere/ui-glass'

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <AmbientBackground />
      <GrainOverlay />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
          <p className="text-white/60">Sign up to get started with Novasphere</p>
        </div>
        <SignUpView />
      </div>
    </div>
  )
}
