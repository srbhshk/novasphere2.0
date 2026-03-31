import type * as React from 'react'
import { AmbientBackground, GrainOverlay } from '@novasphere/ui-glass'
import AuthShowcase from './components/AuthShowcase'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto">
      <AmbientBackground />
      <GrainOverlay />
      <div className="relative z-10 grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-2">
        <section className="h-[45svh] min-h-[18rem] w-full lg:h-auto lg:min-h-[100dvh]">
          <AuthShowcase />
        </section>
        <section className="flex min-h-0 items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
