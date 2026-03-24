'use client'

import type React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown } from 'lucide-react'
import { GlassPanel } from '@novasphere/ui-glass'
import type { TenantConfig } from '@novasphere/tenant-core'

export type TenantSwitcherProps = {
  tenants: TenantConfig[]
  currentTenantId: string
  onSwitch: (tenantId: string) => void
  className?: string
}

export function TenantSwitcher({
  tenants,
  currentTenantId,
  onSwitch,
  className,
}: TenantSwitcherProps): React.JSX.Element {
  const current = tenants.find((t) => t.id === currentTenantId) ?? tenants[0]

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Switch tenant"
          className={`flex items-center gap-2 rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 text-sm text-[color:var(--ns-color-text)] hover:border-[color:var(--ns-color-border-hi)] hover:bg-[color:var(--ns-glass-bg-medium)] ${className != null ? className : ''}`}
        >
          <span>{current?.name ?? 'Tenant'}</span>
          <ChevronDown className="h-4 w-4 text-[color:var(--ns-color-muted)]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="start" className="z-50 outline-none">
          <GlassPanel variant="strong" className="min-w-[180px] p-1">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => onSwitch(tenant.id)}
                className="w-full rounded px-2 py-2 text-left text-sm text-[color:var(--ns-color-text)] hover:bg-[color:var(--ns-glass-bg-subtle)]"
              >
                {tenant.name}
              </button>
            ))}
          </GlassPanel>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
