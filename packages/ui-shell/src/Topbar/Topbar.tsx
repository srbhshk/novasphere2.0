import * as React from 'react'

import type { BreadcrumbItem, TenantConfig } from '@novasphere/tenant-core'
import { GlassPanel } from '@novasphere/ui-glass'

import BreadcrumbBar from '../BreadcrumbBar/BreadcrumbBar'

export type TopbarProps = {
  tenant: TenantConfig
  title: string
  breadcrumbs?: BreadcrumbItem[]
  rightSlot?: React.ReactNode
}

export default function Topbar({
  tenant: _tenant,
  title,
  breadcrumbs,
  rightSlot,
}: TopbarProps): React.JSX.Element {
  return (
    <div className="relative z-20 flex-shrink-0">
      <GlassPanel
        variant="subtle"
        className="flex h-14 items-center justify-between !rounded-none !border-x-0 !border-t-0 px-4 shadow-[var(--ns-shadow-topbar)]"
      >
        <div className="min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <BreadcrumbBar items={breadcrumbs} />
          ) : (
            <div className="truncate text-sm font-medium text-[color:var(--ns-color-text)]">
              {title}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">{rightSlot}</div>
      </GlassPanel>
    </div>
  )
}
