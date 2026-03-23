import * as React from 'react'

import type { BreadcrumbItem, TenantConfig } from '@novasphere/tenant-core'
import { AmbientBackground, GrainOverlay } from '@novasphere/ui-glass'

import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'

export type AppShellProps = {
  tenant: TenantConfig
  currentPath: string
  title: string
  breadcrumbs?: BreadcrumbItem[]
  sidebarBottomSlot?: React.ReactNode
  topbarRightSlot?: React.ReactNode
  children: React.ReactNode
}

function createAccentColorOverrideCss(accentColor: string): string {
  return `:root { --ns-color-accent: ${accentColor}; }`
}

export default function AppShell({
  tenant,
  currentPath,
  title,
  breadcrumbs,
  sidebarBottomSlot,
  topbarRightSlot,
  children,
}: AppShellProps): React.JSX.Element {
  const accentColor = tenant.accentColor?.trim()
  const accentOverrideCss =
    accentColor && accentColor.length > 0
      ? createAccentColorOverrideCss(accentColor)
      : null

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-[color:var(--ns-color-bg)]">
      <AmbientBackground />
      <GrainOverlay />
      {accentOverrideCss ? <style>{accentOverrideCss}</style> : null}

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          tenant={tenant}
          currentPath={currentPath}
          bottomSlot={sidebarBottomSlot}
        />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Topbar
            tenant={tenant}
            title={title}
            {...(breadcrumbs ? { breadcrumbs } : {})}
            {...(topbarRightSlot ? { rightSlot: topbarRightSlot } : {})}
          />
          <main className="relative flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
