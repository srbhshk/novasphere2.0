'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { getBreadcrumbs } from '@novasphere/tenant-core/breadcrumbs'
import type { BreadcrumbItem } from '@novasphere/tenant-core/breadcrumbs'
import type { TenantConfig } from '@novasphere/tenant-core'
import { AppShell } from '@novasphere/ui-shell'
import { AuthGuard, UserMenu } from '@novasphere/ui-auth'
import { AdapterStatusBadge } from '@novasphere/ui-agent'
import { useSession } from '@/lib/auth/auth-client'
import { betterAuthAdapter, toAuthSession } from '@/lib/auth/better-auth-adapter'
import { useAgentPanelStore } from '@/store/agent.store'
import { useLayoutStore } from '@/store/layout.store'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { CopilotChatProvider } from './CopilotContext'
import CopilotDock from './CopilotDock'

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

function RedirectToSignIn(): React.JSX.Element {
  useEffect(() => {
    window.location.replace('/sign-in')
  }, [])

  return (
    <div className="p-6 text-sm text-[color:var(--ns-color-muted)]">Redirecting…</div>
  )
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
  const setOpen = useAgentPanelStore((s) => s.setOpen)
  const setSuggestions = useAgentPanelStore((s) => s.setSuggestions)
  const setAdapterStatus = useAgentPanelStore((s) => s.setAdapterStatus)
  const setDownloadProgress = useAgentPanelStore((s) => s.setDownloadProgress)
  const isCopilotOpen = useAgentPanelStore((s) => s.isOpen)

  const resetLayout = useLayoutStore((s) => s.resetLayout)

  const tenantWithNav = tenantWithPaths(tenant)
  const breadcrumbs: BreadcrumbItem[] = getBreadcrumbs(pathname, tenant)
  const lastCrumb = breadcrumbs[breadcrumbs.length - 1]
  const title = lastCrumb?.label ?? tenant.name

  const handleSignedOut = (): void => {
    resetLayout()
    setOpen(false)
    setSuggestions([])
    setAdapterStatus('idle')
    setDownloadProgress(0)
    window.location.href = '/sign-in'
  }

  const topbarRightSlot = (
    <div className="flex items-center gap-2">
      <ThemeSwitcher />
      <AdapterStatusBadge
        adapterType={adapterType}
        status={adapterStatus}
        modelName={adapterModel}
        downloadProgress={downloadProgress}
      />
      <UserMenu
        adapter={betterAuthAdapter}
        session={session}
        onSignOut={handleSignedOut}
      />
    </div>
  )

  const sidebarBottomSlot = (
    <UserMenu adapter={betterAuthAdapter} session={session} onSignOut={handleSignedOut} />
  )

  return (
    <AuthGuard
      adapter={betterAuthAdapter}
      loading={
        <div className="p-6 text-sm text-[color:var(--ns-color-muted)]">Loading…</div>
      }
      fallback={<RedirectToSignIn />}
    >
      <CopilotChatProvider>
        <AppShell
          tenant={tenantWithNav}
          currentPath={pathname}
          title={title}
          breadcrumbs={breadcrumbs}
          topbarRightSlot={topbarRightSlot}
          sidebarBottomSlot={sidebarBottomSlot}
        >
          <div
            className={`min-h-0 ${
              isCopilotOpen
                ? 'pr-[calc(var(--ns-copilot-width)+var(--ns-copilot-gap))]'
                : ''
            }`}
          >
            {children}
          </div>
          <CopilotDock />
        </AppShell>
      </CopilotChatProvider>
    </AuthGuard>
  )
}
