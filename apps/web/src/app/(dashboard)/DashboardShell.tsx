'use client'

import { usePathname } from 'next/navigation'
import type { TenantConfig } from '@novasphere/tenant-core'
import { AppShell } from '@novasphere/ui-shell'
import { UserMenu } from '@novasphere/ui-auth'
import { AdapterStatusBadge } from '@novasphere/ui-agent'
import { useSession } from '@/lib/auth/auth-client'
import { betterAuthAdapter, toAuthSession } from '@/lib/auth/better-auth-adapter'
import { useAgentPanelStore } from '@/store/agent.store'
import ThemeSwitcher from '@/components/ThemeSwitcher'

type DashboardShellProps = {
  tenant: TenantConfig
  children: React.ReactNode
}

function tenantWithPaths(tenant: TenantConfig): TenantConfig {
  return {
    ...tenant,
    navItems: tenant.navItems.map((item) => ({
      ...item,
      href: `/${tenant.slug}${item.href}`,
    })),
  }
}

export default function DashboardShell({
  tenant,
  children,
}: DashboardShellProps): React.JSX.Element {
  const pathname = usePathname() ?? '/'
  const { data: sessionData } = useSession()
  const session = toAuthSession(sessionData ?? null)
  const adapterType = useAgentPanelStore((s) => s.adapterType)
  const adapterModel = useAgentPanelStore((s) => s.adapterModel)
  const adapterStatus = useAgentPanelStore((s) => s.adapterStatus)
  const downloadProgress = useAgentPanelStore((s) => s.downloadProgress)

  const tenantWithNav = tenantWithPaths(tenant)

  const topbarRightSlot = (
    <div className="flex items-center gap-2">
      <ThemeSwitcher />
      <AdapterStatusBadge
        adapterType={adapterType}
        status={adapterStatus}
        modelName={adapterModel}
        downloadProgress={downloadProgress}
      />
      <UserMenu adapter={betterAuthAdapter} session={session} />
    </div>
  )

  const sidebarBottomSlot = <UserMenu adapter={betterAuthAdapter} session={session} />

  return (
    <AppShell
      tenant={tenantWithNav}
      currentPath={pathname}
      title="Dashboard"
      topbarRightSlot={topbarRightSlot}
      sidebarBottomSlot={sidebarBottomSlot}
    >
      {children}
    </AppShell>
  )
}
