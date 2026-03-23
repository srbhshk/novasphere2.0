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
  className?: string
}

export function UserMenu({
  adapter,
  session,
  className,
}: UserMenuProps): React.JSX.Element {
  if (session == null) {
    return (
      <Button
        type="button"
        onClick={() => {}}
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
          className="flex items-center gap-2 rounded-full focus:ring-2 focus:ring-white/30 focus:outline-none"
        >
          {session.image != null ? (
            <img
              src={session.image}
              alt=""
              className="h-8 w-8 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-medium text-white">
              {initials || '?'}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="end" className="z-50 outline-none">
          <GlassPanel variant="strong" className="min-w-[200px] p-2">
            <div className="mb-2 border-b border-white/10 pb-2">
              <p className="font-medium text-white">{session.name}</p>
              <p className="text-sm text-white/70">{session.email}</p>
              <span className="mt-1 inline-block rounded bg-white/10 px-2 py-0.5 text-xs text-white/80">
                {session.role}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-300 hover:bg-white/10"
                onClick={() => adapter.signOut()}
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
