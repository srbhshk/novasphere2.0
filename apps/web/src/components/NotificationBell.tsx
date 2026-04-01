'use client'

import * as React from 'react'
import { Bell, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { buildSignalExplainAndRefinePrompt } from '@novasphere/agent-core'
import { createPortal } from 'react-dom'
import { GlassCard, GlassPanel, Button, Badge } from '@novasphere/ui-glass'

import type { AgentRole } from '@/hooks/useCurrentRole'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useSystemHealth } from '@/hooks/useSystemHealth'
import { useDeployments } from '@/hooks/useDeployments'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import type { KpiMetric } from '@/lib/api/contracts'
import { useCopilotChat } from '@/app/(dashboard)/CopilotContext'
import { useAgentPanelStore } from '@/store/agent.store'
import {
  useNotificationsStore,
  type NotificationItem,
  type NotificationSeverity,
} from '@/store/notifications.store'

const EMPTY_NOTIFICATIONS: NotificationItem[] = []

type AnchorRect = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

type PanelStyle = {
  top: number
  right: number
}

type NotificationBellProps = {
  userId: string
  tenantId: string
  role: AgentRole
  enabled: boolean
}

function severityForAnomaly(role: AgentRole): NotificationSeverity {
  return role === 'engineer' ? 'critical' : 'warning'
}

function severityForSystemAlert(
  raw: 'critical' | 'warning' | 'info',
): NotificationSeverity {
  if (raw === 'critical') return 'critical'
  if (raw === 'warning') return 'warning'
  return 'info'
}

function getFirstAnomalousMetric(
  role: AgentRole,
  kpis: KpiMetric[],
): { id: string; label: string; value: number } | null {
  const anomalies = kpis.filter((k) => k.anomaly === true)
  if (anomalies.length === 0) return null

  const rolePriority: ReadonlyArray<string> =
    role === 'engineer'
      ? ['api-latency-p99', 'error-rate', 'api-latency-p50', 'uptime', 'request-volume']
      : role === 'admin'
        ? ['new-signups', 'active-orgs', 'total-users', 'mrr', 'conversion']
        : role === 'viewer'
          ? ['mrr', 'active-users', 'total-users']
          : ['churn', 'mrr', 'nrr', 'arr', 'conversion']

  const byId = new Map(anomalies.map((k) => [k.id, k]))
  for (const id of rolePriority) {
    const found = byId.get(id)
    if (found) return { id: found.id, label: found.label, value: found.value }
  }

  const fallback = anomalies[0]
  return fallback
    ? { id: fallback.id, label: fallback.label, value: fallback.value }
    : null
}

function iconForSeverity(sev: NotificationSeverity): React.ReactNode {
  if (sev === 'critical')
    return <XCircle className="h-4 w-4 text-[var(--ns-color-error)]" />
  if (sev === 'warning')
    return <AlertCircle className="h-4 w-4 text-[var(--ns-color-warning)]" />
  return <CheckCircle2 className="h-4 w-4 text-[var(--ns-color-accent)]" />
}

export default function NotificationBell({
  userId,
  tenantId,
  role,
  enabled,
}: NotificationBellProps): React.JSX.Element | null {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [anchorRect, setAnchorRect] = React.useState<AnchorRect | null>(null)
  const [panelStyle, setPanelStyle] = React.useState<PanelStyle | null>(null)

  const setCopilotOpen = useAgentPanelStore((s) => s.setOpen)
  const { sendMessage, status } = useCopilotChat()
  const chatBusy = status === 'streaming' || status === 'submitted'

  const getStorageKey = useNotificationsStore((s) => s.getStorageKey)
  const hydrate = useNotificationsStore((s) => s.hydrate)
  const upsertMany = useNotificationsStore((s) => s.upsertMany)
  const markRead = useNotificationsStore((s) => s.markRead)
  const dismiss = useNotificationsStore((s) => s.dismiss)

  const storageKey = React.useMemo(
    () => getStorageKey(userId, tenantId),
    [getStorageKey, tenantId, userId],
  )

  const metrics = useDashboardMetrics(role, enabled)
  const system = useSystemHealth(role)
  const deployments = useDeployments({ role, limit: 10 })
  const activity = useActivityFeed({ role, limit: 10 })

  React.useEffect(() => {
    if (!enabled) return
    hydrate(storageKey)
  }, [enabled, hydrate, storageKey])

  React.useEffect(() => {
    if (!enabled) return

    const next: NotificationItem[] = []

    const kpis = (metrics.data as { kpis?: KpiMetric[] } | undefined)?.kpis
    if (Array.isArray(kpis)) {
      const anomaly = getFirstAnomalousMetric(role, kpis)
      if (anomaly) {
        next.push({
          id: `anomaly:${anomaly.id}`,
          kind: 'anomaly',
          severity: severityForAnomaly(role),
          title: 'Signal detected',
          description: `${anomaly.label} anomaly`,
          createdAt: Date.now(),
          unread: true,
          context: { metricLabel: anomaly.label, metricValue: anomaly.value },
        })
      }
    }

    const alerts = (
      system.data as
        | {
            alerts?: Array<{
              id: string
              title: string
              description: string
              severity: 'critical' | 'warning' | 'info'
              resolved: boolean
              service: string
              startsAt: string
            }>
          }
        | undefined
    )?.alerts
    if (Array.isArray(alerts)) {
      for (const a of alerts) {
        if (a.resolved) continue
        next.push({
          id: `system_alert:${a.id}`,
          kind: 'system_alert',
          severity: severityForSystemAlert(a.severity),
          title: a.title,
          description: `${a.service} · ${a.description}`,
          createdAt: new Date(a.startsAt).getTime(),
          unread: true,
        })
      }
    }

    const depItems = (
      deployments.data as
        | {
            items?: Array<{
              id: string
              version: string
              environment: string
              status: string
              commitMessage: string
              author: string
              startedAt: string
            }>
          }
        | undefined
    )?.items
    if (Array.isArray(depItems)) {
      for (const d of depItems) {
        if (d.status !== 'failed' && d.status !== 'rolled_back') continue
        next.push({
          id: `deployment:${d.id}`,
          kind: 'deployment',
          severity: d.status === 'failed' ? 'critical' : 'warning',
          title: `Deployment ${d.status === 'failed' ? 'failed' : 'rolled back'}`,
          description: `${d.version} · ${d.environment} · ${d.commitMessage}`,
          createdAt: new Date(d.startedAt).getTime(),
          unread: true,
        })
      }
    }

    const events = (
      activity.data as
        | {
            items?: Array<{
              id: string
              message: string
              severity: 'info' | 'warning' | 'error'
              timestamp: string
            }>
          }
        | undefined
    )?.items
    if (Array.isArray(events)) {
      for (const e of events) {
        if (e.severity !== 'error') continue
        next.push({
          id: `activity:${e.id}`,
          kind: 'activity',
          severity: 'warning',
          title: 'Activity event',
          description: e.message,
          createdAt: new Date(e.timestamp).getTime(),
          unread: true,
        })
      }
    }

    if (next.length > 0) {
      upsertMany(storageKey, next)
    }
  }, [
    activity.data,
    deployments.data,
    enabled,
    metrics.data,
    role,
    storageKey,
    system.data,
    upsertMany,
  ])

  const items = useNotificationsStore(
    (s) => s.itemsByKey[storageKey] ?? EMPTY_NOTIFICATIONS,
  )
  const unreadCount = React.useMemo(
    () => items.reduce((acc, n) => acc + (n.unread ? 1 : 0), 0),
    [items],
  )

  const syncAnchorRect = (): void => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setAnchorRect({
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    })
  }

  React.useEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }
    syncAnchorRect()

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }

    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setOpen(false)
    }

    const onScrollOrResize = (): void => {
      syncAnchorRect()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, { capture: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, { capture: true })
    }
  }, [open])

  React.useEffect(() => {
    if (!open || !anchorRect) return
    const top = Math.min(anchorRect.bottom + 10, window.innerHeight - 8)
    const right = Math.max(8, window.innerWidth - anchorRect.right)
    setPanelStyle({ top, right })
  }, [anchorRect, open])

  const panel =
    open && panelStyle
      ? createPortal(
          <div className="fixed z-[1000]" style={panelStyle}>
            <div ref={panelRef}>
              <GlassPanel
                variant="strong"
                className="w-[min(420px,calc(100vw-2rem))] p-3"
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-2">
                  <div className="text-sm font-semibold text-[var(--ns-color-text)]">
                    Notifications
                  </div>
                  {unreadCount > 0 ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {unreadCount} unread
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      All caught up
                    </Badge>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto px-1">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[var(--ns-color-muted)]">
                      No notifications
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.map((n) => (
                        <GlassCard
                          key={n.id}
                          variant="subtle"
                          className="flex items-start gap-3 p-3"
                        >
                          <div className="mt-0.5 shrink-0">
                            {iconForSeverity(n.severity)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-medium text-[var(--ns-color-text)]">
                                {n.title}
                              </div>
                              {n.unread ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ns-color-accent)]" />
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-[var(--ns-color-muted)]">
                              {n.description}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Button
                                variant="secondary"
                                disabled={chatBusy}
                                onClick={() => {
                                  markRead(storageKey, n.id)
                                  setCopilotOpen(true)
                                  setOpen(false)

                                  if (n.kind === 'anomaly') {
                                    const metricLabel =
                                      n.context?.metricLabel ?? n.description
                                    const metricValue = n.context?.metricValue ?? 0
                                    sendMessage({
                                      text: buildSignalExplainAndRefinePrompt({
                                        metricLabel,
                                        metricValue,
                                        role,
                                      }),
                                    })
                                    return
                                  }

                                  sendMessage({
                                    text: `Investigate this signal and recommend next actions:\n\n- Type: ${n.kind}\n- Severity: ${n.severity}\n- Title: ${n.title}\n- Details: ${n.description}\n\nKeep the dashboard layout stable; focus on explanation and priorities.`,
                                  })
                                }}
                              >
                                Investigate
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  dismiss(storageKey, n.id)
                                }}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              </GlassPanel>
            </div>
          </div>,
          document.body,
        )
      : null

  if (!enabled || userId === 'anonymous') return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'
        }
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] text-[var(--ns-color-text)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ns-color-accent)]/60 focus-visible:outline-none"
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          if (nextOpen) {
            syncAnchorRect()
          }
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ns-color-accent)] px-1 text-[10px] font-semibold text-[color:var(--ns-color-bg)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
      {panel}
    </>
  )
}
