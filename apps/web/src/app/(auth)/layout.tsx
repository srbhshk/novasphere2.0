import type * as React from 'react'
import { AmbientBackground, GrainOverlay } from '@novasphere/ui-glass'
import AuthShowcase from './components/AuthShowcase'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <main className="relative h-screen min-h-screen overflow-hidden">
      <AmbientBackground />
      <GrainOverlay />
      <div className="relative z-10 grid h-full w-full grid-cols-1 lg:grid-cols-2">
        <section className="h-[45vh] min-h-[20rem] w-full lg:h-full lg:min-h-0">
          <AuthShowcase />
        </section>
        <section className="flex h-full min-h-0 items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
