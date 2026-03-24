import type React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SignUpView from './SignUpView'
import { novaConfig } from 'nova.config'

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="w-full rounded-3xl border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-medium)] p-5 backdrop-blur-xl sm:p-7">
      <div className="mb-6 sm:mb-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-1.5">
          <Image
            src="/branding/novasphere-mark.png"
            alt="Novasphere logo"
            width={24}
            height={24}
            className="h-6 w-6 rounded-sm object-cover"
            priority
          />
          <span className="text-xs font-medium tracking-[0.14em] text-[color:var(--ns-color-text)]/80 uppercase">
            Novasphere
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[color:var(--ns-color-text)] sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ns-color-muted)]">
          Start using {novaConfig.product.name} in minutes with secure access and guided
          setup.
        </p>
      </div>
      <SignUpView />
      <div className="mt-5 flex flex-col gap-2.5 text-sm text-[color:var(--ns-color-muted)]">
        <p>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-[color:var(--ns-color-accent)] underline decoration-[color:var(--ns-color-border-hi)] underline-offset-4 transition-colors hover:text-[color:var(--ns-color-accent-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-color-accent)]"
          >
            Sign in
          </Link>
        </p>
        <p>
          Need help with access?{' '}
          <Link
            href="/forgot-password"
            className="font-medium text-[color:var(--ns-color-accent)] underline decoration-[color:var(--ns-color-border-hi)] underline-offset-4 transition-colors hover:text-[color:var(--ns-color-accent-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-color-accent)]"
          >
            Reset password
          </Link>
        </p>
      </div>
    </div>
  )
}
