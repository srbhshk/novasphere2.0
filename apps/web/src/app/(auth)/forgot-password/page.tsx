import type React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ForgotPasswordView from './ForgotPasswordView'
import { novaConfig } from 'nova.config'

export default function ForgotPasswordPage(): React.JSX.Element {
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
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ns-color-muted)]">
          Enter your account email and we&apos;ll send secure reset instructions for{' '}
          {novaConfig.product.name}.
        </p>
      </div>
      <ForgotPasswordView />
      <div className="mt-5 flex flex-col gap-2.5 text-sm text-[color:var(--ns-color-muted)]">
        <p>
          Remembered your password?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-[color:var(--ns-color-accent)] underline decoration-[color:var(--ns-color-border-hi)] underline-offset-4 transition-colors hover:text-[color:var(--ns-color-accent-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-color-accent)]"
          >
            Back to sign in
          </Link>
        </p>
        <p>
          No account yet?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-[color:var(--ns-color-accent)] underline decoration-[color:var(--ns-color-border-hi)] underline-offset-4 transition-colors hover:text-[color:var(--ns-color-accent-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-color-accent)]"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  )
}
