import * as React from 'react'

import type { TenantConfig } from '@novasphere/tenant-core'

import { cn } from '../lib/utils'
import { getNavIconByName } from '../lib/nav-icons'

export type MobileBottomNavProps = {
  tenant: TenantConfig
  currentPath: string
}

export default function MobileBottomNav({
  tenant,
  currentPath,
}: MobileBottomNavProps): React.JSX.Element {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-medium)] backdrop-blur-xl sm:hidden"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {tenant.navItems.map((item) => {
          const isActive = currentPath.startsWith(item.href)
          const Icon = getNavIconByName(item.icon)
          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-xs',
                'text-[color:var(--ns-color-muted)] transition-colors',
                isActive
                  ? 'text-[color:var(--ns-color-accent)]'
                  : 'hover:text-[color:var(--ns-color-text)]',
              )}
            >
              <Icon aria-hidden="true" size={18} />
              <span className="w-full truncate text-center">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
