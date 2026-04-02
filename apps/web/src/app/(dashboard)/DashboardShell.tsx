'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { getBreadcrumbs } from '@novasphere/tenant-core/breadcrumbs'
import type { BreadcrumbItem } from '@novasphere/tenant-core/breadcrumbs'
import { FALLBACK_TENANT } from '@novasphere/tenant-core/tenant.types'
import type { TenantConfig } from '@novasphere/tenant-core'
import { novaConfig } from 'nova.config'
import { AppShell } from '@novasphere/ui-shell'
import { AuthGuard, UserMenu } from '@novasphere/ui-auth'
import { AdapterStatusBadge } from '@novasphere/ui-agent'
import { SvgLoader } from '@novasphere/ui-glass'
import { useSession } from '@/lib/auth/auth-client'
import { betterAuthAdapter, toAuthSession } from '@/lib/auth/better-auth-adapter'
import { useAgentPanelStore } from '@/store/agent.store'
import { useLayoutStore } from '@/store/layout.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { layoutStorageKey } from '@/store/layout-persistence'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import NotificationBell from '@/components/NotificationBell'
import DemoGuidedTour from '@/components/DemoGuidedTour'
import CopilotDock from './CopilotDock'
import CopilotCoachmark from './CopilotCoachmark'

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

function normalizeAgentRole(
  role: string | undefined,
): 'admin' | 'ceo' | 'engineer' | 'viewer' {
  const r = role?.trim().toLowerCase()
  if (r === 'admin' || r === 'ceo' || r === 'engineer' || r === 'viewer') {
    return r
  }
  return 'viewer'
}

export default function DashboardShell({
  tenant,
  children,
}: DashboardShellProps): React.JSX.Element {
  const pathname = usePathname() ?? '/'
  const { data: sessionData } = useSession()
  const session = toAuthSession(sessionData ?? null)
  const role = normalizeAgentRole(session?.role)
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
  const hydrateLayout = useLayoutStore((s) => s.hydrate)
  const clearNotifications = useNotificationsStore((s) => s.clearAll)
  const getNotificationsKey = useNotificationsStore((s) => s.getStorageKey)
  const notificationsKey = useMemo(
    () =>
      getNotificationsKey(session?.userId ?? 'anonymous', session?.tenantId ?? 'demo'),
    [getNotificationsKey, session?.tenantId, session?.userId],
  )

  useEffect(() => {
    if (!session?.userId || !session?.tenantId) return
    hydrateLayout(layoutStorageKey(session.userId, session.tenantId))
  }, [hydrateLayout, session?.tenantId, session?.userId])

  const tenantWithNav = tenantWithPaths(tenant)
  /** First crumb uses DB `organization.name` when resolved; fallback tenant uses `nova.config` product name (shell never imported it before). */
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const items = getBreadcrumbs(pathname, tenant)
    if (items.length === 0) return items
    const first = items[0]
    const rest = items.slice(1)
    if (!first) return items
    const isStaticFallback =
      tenant.id === FALLBACK_TENANT.id &&
      tenant.slug === FALLBACK_TENANT.slug &&
      tenant.name === FALLBACK_TENANT.name
    const label = isStaticFallback ? novaConfig.product.name : first.label
    const firstItem: BreadcrumbItem = { href: first.href, label }
    return [firstItem, ...rest]
  }, [pathname, tenant])
  const lastCrumb = breadcrumbs[breadcrumbs.length - 1]
  const title = lastCrumb?.label ?? tenant.name

  const handleSignedOut = (): void => {
    resetLayout()
    setOpen(false)
    setSuggestions([])
    setAdapterStatus('idle')
    setDownloadProgress(0)
    if (session?.userId) {
      clearNotifications(notificationsKey)
    }
    window.location.href = '/sign-in'
  }

  const topbarRightSlot = (
    <div className="flex items-center gap-2">
      <ThemeSwitcher />
      <NotificationBell
        userId={session?.userId ?? 'anonymous'}
        tenantId={session?.tenantId ?? 'demo'}
        role={role}
        enabled={session != null}
      />
      {novaConfig.agent.showAdapterStatus ? (
        <AdapterStatusBadge
          adapterType={adapterType}
          status={adapterStatus}
          modelName={adapterModel}
          downloadProgress={downloadProgress}
        />
      ) : null}
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
        <AppShell
          tenant={tenantWithNav}
          currentPath={pathname}
          title={title}
          breadcrumbs={breadcrumbs}
          topbarRightSlot={
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
            </div>
          }
        >
          <div className="flex h-full w-full items-center justify-center">
            <SvgLoader label="Loading dashboard" />
          </div>
        </AppShell>
      }
      fallback={<RedirectToSignIn />}
    >
      <AppShell
        tenant={tenantWithNav}
        currentPath={pathname}
        title={title}
        breadcrumbs={breadcrumbs}
        topbarRightSlot={topbarRightSlot}
        sidebarBottomSlot={sidebarBottomSlot}
      >
        {session?.userId && session?.tenantId ? (
          <DemoGuidedTour userId={session.userId} tenantId={session.tenantId} />
        ) : null}
        <div
          className={`min-h-0 ${
            isCopilotOpen
              ? 'lg:pr-[calc(var(--ns-copilot-width)+var(--ns-copilot-gap))]'
              : ''
          }`}
        >
          {children}
        </div>
        <CopilotDock />
        <CopilotCoachmark isCopilotOpen={isCopilotOpen} />
      </AppShell>
    </AuthGuard>
  )
}
