import * as React from 'react'

import type { AuthSession } from '@novasphere/ui-auth'
import type { TenantConfig } from '@novasphere/tenant-core'
import { GlassPanel } from '@novasphere/ui-glass'

import NavItem from '../NavItem/NavItem'

export type SidebarProps = {
  tenant: TenantConfig
  currentPath: string
  userSession?: AuthSession | null
  bottomSlot?: React.ReactNode
}

function getTenantInitials(tenantName: string): string {
  const trimmed = tenantName.trim()
  if (trimmed.length === 0) {
    return 'NS'
  }
  return trimmed.slice(0, 2).toUpperCase()
}

export default function Sidebar({
  tenant,
  currentPath,
  userSession: _userSession,
  bottomSlot,
}: SidebarProps): React.JSX.Element {
  const isCollapsed = true

  return (
    <div className="relative z-30 h-full flex-shrink-0">
      <GlassPanel
        variant="strong"
        className="flex h-full w-[72px] flex-col !rounded-none !border-y-0 !border-l-0 p-2 shadow-[var(--ns-shadow-sidebar)]"
      >
        <div className="flex h-12 items-center justify-center">
          {tenant.logoUrl ? (
            <img
              alt={`${tenant.name} logo`}
              src={tenant.logoUrl}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--ns-glass-bg-subtle)] text-xs font-semibold text-[color:var(--ns-color-text)]">
              {getTenantInitials(tenant.name)}
            </div>
          )}
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1">
          {tenant.navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentPath.startsWith(item.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {bottomSlot ? <div className="mt-auto">{bottomSlot}</div> : null}
      </GlassPanel>
    </div>
  )
}
