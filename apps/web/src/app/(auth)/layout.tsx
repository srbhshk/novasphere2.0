import type * as React from 'react'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <main className="relative z-10 min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-12">
        {children}
      </div>
    </main>
  )
}
