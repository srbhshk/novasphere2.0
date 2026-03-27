'use client'

import type React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { LogIn, LogOut, User, Settings } from 'lucide-react'
import { GlassPanel } from '@novasphere/ui-glass'
import type { AuthAdapter } from '../auth.adapter.interface'
import type { AuthSession } from '../auth.types'
import { Button } from '../form-primitives'

export type UserMenuProps = {
  adapter: AuthAdapter
  session: AuthSession | null
  onSignOut?: () => void
  className?: string
}

export function UserMenu({
  adapter,
  session,
  onSignOut,
  className,
}: UserMenuProps): React.JSX.Element {
  if (session == null) {
    return (
      <Button
        type="button"
        onClick={() => {
          window.location.href = '/sign-in'
        }}
        {...(className != null ? { className } : {})}
        aria-label="Sign in"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign in
      </Button>
    )
  }

  const initials = session.name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="flex items-center gap-2 rounded-full focus:ring-2 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
        >
          {session.image != null ? (
            <img
              src={session.image}
              alt=""
              className="h-8 w-8 rounded-full border border-[color:var(--ns-color-border)] object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--ns-color-accent-20)] text-sm font-medium text-[color:var(--ns-color-text)]">
              {initials || '?'}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="end" className="z-50 outline-none">
          <GlassPanel variant="strong" className="min-w-[200px] p-2">
            <div className="mb-2 border-b border-[color:var(--ns-color-border)] pb-2">
              <p className="font-medium text-[color:var(--ns-color-text)]">
                {session.name}
              </p>
              <p className="text-sm text-[color:var(--ns-color-muted)]">
                {session.email}
              </p>
              <span className="mt-1 inline-block rounded bg-[color:var(--ns-glass-bg-subtle)] px-2 py-0.5 text-xs text-[color:var(--ns-color-muted)]">
                {session.role}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[color:var(--ns-color-text)] hover:bg-[color:var(--ns-glass-bg-subtle)]"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[color:var(--ns-color-text)] hover:bg-[color:var(--ns-glass-bg-subtle)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[color:var(--ns-color-danger)] hover:bg-[color:var(--ns-glass-bg-subtle)]"
                onClick={async () => {
                  await adapter.signOut()
                  onSignOut?.()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </GlassPanel>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
