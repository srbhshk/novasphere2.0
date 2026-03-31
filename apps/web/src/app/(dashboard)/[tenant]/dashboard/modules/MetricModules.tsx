'use client'

import type { ComponentType } from 'react'
import {
  DollarSign,
  Users,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Zap,
  AlertCircle,
  Activity,
  BarChart2,
  Clock,
} from 'lucide-react'
import type { BentoCardModuleProps } from '@novasphere/ui-bento'
import { Skeleton } from '@novasphere/ui-glass'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import type { KpiMetric } from '@/lib/api/contracts'
import { ModuleWrapper } from './ModuleWrapper'

type MetricCardInnerProps = {
  metric: KpiMetric
  icon: ComponentType<{ className?: string }>
}

function formatValue(metric: KpiMetric): string {
  const { value, unit, prefix = '', suffix = '' } = metric
  let formatted: string
  if (unit === 'currency') {
    if (value >= 1_000_000) formatted = `${(value / 1_000_000).toFixed(1)}M`
    else if (value >= 1_000) formatted = `${(value / 1_000).toFixed(1)}K`
    else formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  } else if (unit === 'percent') {
    formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  } else if (unit === 'ms') {
    formatted = value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  } else {
    if (value >= 1_000_000) formatted = `${(value / 1_000_000).toFixed(1)}M`
    else if (value >= 1_000) formatted = `${(value / 1_000).toFixed(1)}K`
    else formatted = value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  return `${prefix}${formatted}${suffix}`
}

function MetricCardInner({
  metric,
  icon: Icon,
}: MetricCardInnerProps): React.JSX.Element {
  const trendColor =
    metric.deltaDirection === 'up'
      ? metric.anomaly
        ? 'text-[var(--ns-color-error)]'
        : 'text-[var(--ns-color-success)]'
      : metric.deltaDirection === 'down'
        ? 'text-[var(--ns-color-error)]'
        : 'text-[var(--ns-color-muted)]'

  const trendSign = metric.trend >= 0 ? '+' : ''

  return (
    <div className="flex h-full items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
            <Icon className="h-4 w-4 text-[var(--ns-color-accent)]" aria-hidden="true" />
          </div>
          <span className="truncate text-xs font-medium text-[var(--ns-color-muted)]">
            {metric.label}
          </span>
        </div>
        {metric.anomaly ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--ns-color-error)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--ns-color-error)]">
            <AlertCircle className="h-3 w-3" aria-hidden="true" /> Signal
          </span>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-bold tracking-tight text-[var(--ns-color-text)] tabular-nums">
          {formatValue(metric)}
        </div>
        <div className={`mt-1 text-xs font-medium tabular-nums ${trendColor}`}>
          {trendSign}
          {metric.trend.toFixed(1)}% vs last month
        </div>
      </div>
    </div>
  )
}

function MetricSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col justify-between">
      <Skeleton width="60%" height={14} />
      <div className="flex flex-col gap-1">
        <Skeleton width="80%" height={28} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  )
}

// --- CEO / Admin metric modules ---

export function MetricMRRModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'mrr',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={DollarSign} />
      )}
    </ModuleWrapper>
  )
}

export function MetricARRModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'arr',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={TrendingUp} />
      )}
    </ModuleWrapper>
  )
}

export function MetricNRRModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'nrr',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={RefreshCw} />
      )}
    </ModuleWrapper>
  )
}

export function MetricChurnModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'churn',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={TrendingDown} />
      )}
    </ModuleWrapper>
  )
}

export function MetricARPUModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'arpu',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={BarChart2} />
      )}
    </ModuleWrapper>
  )
}

export function MetricLTVModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'ltv',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={DollarSign} />
      )}
    </ModuleWrapper>
  )
}

export function MetricConversionModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'conversion',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={Zap} />
      )}
    </ModuleWrapper>
  )
}

export function MetricUsersModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const r = role === 'engineer' ? 'admin' : role
  const { data, isLoading } = useDashboardMetrics(r)
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'total-users' || k.id === 'active-users',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={Users} />
      )}
    </ModuleWrapper>
  )
}

// --- Engineer metric modules ---

export function MetricApiLatencyModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(
    role === 'engineer' ? 'engineer' : 'engineer',
  )
  const p50 = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'api-latency-p50',
  )
  const p99 = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'api-latency-p99',
  )
  return (
    <ModuleWrapper title={config.title ?? 'API Latency'}>
      {isLoading ? (
        <MetricSkeleton />
      ) : (
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
              <Clock className="h-4 w-4 text-[var(--ns-color-accent)]" />
            </div>
            <span className="text-xs font-medium text-[var(--ns-color-muted)]">
              API Latency
            </span>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] text-[var(--ns-color-muted)]">p50</div>
              <div className="text-xl font-bold text-[var(--ns-color-text)]">
                {p50?.value ?? '—'}ms
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--ns-color-muted)]">p99</div>
              <div
                className={`text-xl font-bold ${p99?.anomaly ? 'text-[var(--ns-color-error)]' : 'text-[var(--ns-color-text)]'}`}
              >
                {p99?.value ?? '—'}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </ModuleWrapper>
  )
}

export function MetricErrorRateModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'error-rate',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={AlertCircle} />
      )}
    </ModuleWrapper>
  )
}

export function MetricUptimeModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'uptime',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={Activity} />
      )}
    </ModuleWrapper>
  )
}

export function MetricRequestVolumeModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'request-volume',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={Zap} />
      )}
    </ModuleWrapper>
  )
}

// Admin-only KPIs

export function MetricNewSignupsModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('admin')
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'new-signups',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={Users} />
      )}
    </ModuleWrapper>
  )
}

export function MetricActiveOrgsModule({
  config: _config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('admin')
  const metric = (data as { kpis?: KpiMetric[] } | undefined)?.kpis?.find(
    (k) => k.id === 'active-orgs',
  )
  return (
    <ModuleWrapper>
      {isLoading || !metric ? (
        <MetricSkeleton />
      ) : (
        <MetricCardInner metric={metric} icon={BarChart2} />
      )}
    </ModuleWrapper>
  )
}
