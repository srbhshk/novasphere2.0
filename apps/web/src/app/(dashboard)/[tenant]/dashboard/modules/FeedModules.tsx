'use client'

import { AlertCircle, CheckCircle2, Clock, GitCommit, Info, XCircle } from 'lucide-react'
import type { BentoCardModuleProps } from '@novasphere/ui-bento'
import { Badge, ScrollArea } from '@novasphere/ui-glass'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { useDeployments } from '@/hooks/useDeployments'
import { useSystemHealth } from '@/hooks/useSystemHealth'
import type {
  ActivityEvent,
  Deployment,
  SystemAlert,
  DeploymentStatus,
} from '@/lib/api/contracts'
import { ModuleWrapper } from './ModuleWrapper'

function formatTimestamp(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'Just now'
}

function ActivityEventRow({ event }: { event: ActivityEvent }): React.JSX.Element {
  const Icon =
    event.severity === 'error'
      ? XCircle
      : event.severity === 'warning'
        ? AlertCircle
        : Info

  const iconColor =
    event.severity === 'error'
      ? 'text-[var(--ns-color-error)]'
      : event.severity === 'warning'
        ? 'text-[var(--ns-color-warning)]'
        : 'text-[var(--ns-color-accent)]'

  return (
    <div className="flex gap-2.5 rounded-lg border border-[var(--ns-color-border-subtle)] bg-[var(--ns-glass-bg-subtle)] px-3 py-2.5">
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-[var(--ns-color-text)]">
          {event.message}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--ns-color-muted)]">
          {event.actor ? <span>{event.actor.split(' ')[0]}</span> : null}
          <span>{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeedModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useActivityFeed({ role, limit: 20 })
  const events = data?.items ?? []
  const wrapperTitle = config.title ? undefined : 'Activity Feed'
  return (
    <ModuleWrapper title={wrapperTitle}>
      <ScrollArea className="max-h-[420px]">
        <div className="flex flex-col gap-2">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded-lg bg-[var(--ns-color-surface-muted)]"
                />
              ))
            : events.map((event) => <ActivityEventRow key={event.id} event={event} />)}
          {!isLoading && events.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ns-color-muted)]">
              No recent activity
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </ModuleWrapper>
  )
}

const STATUS_ICON: Record<DeploymentStatus, React.ReactNode> = {
  success: <CheckCircle2 className="h-3.5 w-3.5 text-[var(--ns-color-success)]" />,
  failed: <XCircle className="h-3.5 w-3.5 text-[var(--ns-color-error)]" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-[var(--ns-color-warning)]" />,
  rolled_back: <AlertCircle className="h-3.5 w-3.5 text-[var(--ns-color-warning)]" />,
}

const STATUS_LABEL: Record<DeploymentStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  in_progress: 'In Progress',
  rolled_back: 'Rolled Back',
}

function DeploymentRow({ deployment }: { deployment: Deployment }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ns-color-border-subtle)] bg-[var(--ns-glass-bg-subtle)] px-3 py-2.5">
      <div className="shrink-0">{STATUS_ICON[deployment.status]}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--ns-color-text)]">
            {deployment.version}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {deployment.environment}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ns-color-muted)]">
          <GitCommit className="h-3 w-3" />
          <span className="truncate">{deployment.commitMessage}</span>
        </div>
        <div className="mt-0.5 text-xs text-[var(--ns-color-muted)]">
          {deployment.author.split(' ')[0]} · {formatTimestamp(deployment.startedAt)} ·{' '}
          {deployment.duration}s
        </div>
      </div>
      <div className="shrink-0 text-xs text-[var(--ns-color-muted)]">
        {STATUS_LABEL[deployment.status]}
      </div>
    </div>
  )
}

export function DeploymentLogModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDeployments({ role })
  const deployments = data?.items ?? []
  const wrapperTitle = config.title ? undefined : 'Recent Deployments'
  return (
    <ModuleWrapper title={wrapperTitle}>
      <ScrollArea className="max-h-[420px]">
        <div className="flex flex-col gap-2">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-16 w-full animate-pulse rounded-lg bg-[var(--ns-color-surface-muted)]"
                />
              ))
            : deployments.map((d) => <DeploymentRow key={d.id} deployment={d} />)}
          {!isLoading && deployments.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ns-color-muted)]">
              No deployments
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </ModuleWrapper>
  )
}

function AlertRow({ alert }: { alert: SystemAlert }): React.JSX.Element {
  const Icon =
    alert.severity === 'critical'
      ? XCircle
      : alert.severity === 'warning'
        ? AlertCircle
        : Info

  const borderColor =
    alert.severity === 'critical'
      ? 'border-[var(--ns-color-error)]/40'
      : alert.severity === 'warning'
        ? 'border-[var(--ns-color-warning)]/40'
        : 'border-[var(--ns-color-border-subtle)]'

  const iconColor =
    alert.severity === 'critical'
      ? 'text-[var(--ns-color-error)]'
      : alert.severity === 'warning'
        ? 'text-[var(--ns-color-warning)]'
        : 'text-[var(--ns-color-accent)]'

  return (
    <div
      className={`flex gap-2.5 rounded-lg border bg-[var(--ns-glass-bg-subtle)] px-3 py-2.5 ${borderColor}`}
    >
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--ns-color-text)]">
            {alert.title}
          </span>
          {alert.resolved ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Resolved
            </Badge>
          ) : (
            <Badge variant="destructive" className="shrink-0 text-[10px]">
              Active
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-[var(--ns-color-muted)]">
          {alert.description}
        </div>
        <div className="mt-0.5 text-xs text-[var(--ns-color-muted)]">
          {alert.service} · {formatTimestamp(alert.startsAt)}
        </div>
      </div>
    </div>
  )
}

export function SystemAlertsModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useSystemHealth(role)
  const alerts = data?.alerts ?? []
  const wrapperTitle = config.title ? undefined : 'System Alerts'
  return (
    <ModuleWrapper title={wrapperTitle}>
      <ScrollArea className="max-h-[420px]">
        <div className="flex flex-col gap-2">
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="h-16 w-full animate-pulse rounded-lg bg-[var(--ns-color-surface-muted)]"
                />
              ))
            : alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
          {!isLoading && alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="h-6 w-6 text-[var(--ns-color-success)]" />
              <div className="text-sm text-[var(--ns-color-muted)]">
                All systems operational
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </ModuleWrapper>
  )
}
