'use client'

import type { ComponentType } from 'react'
import { DollarSign, Users, TrendingDown } from 'lucide-react'
import type { BentoCardModuleProps, BentoModuleRegistry } from '@novasphere/ui-bento'
import {
  AreaChart,
  DonutChart,
  HeatmapChart,
  SparklineChart,
} from '@novasphere/ui-charts'
import { useMetricsList } from '@/hooks/useMetricsList'

function MetricCard({
  config,
  label: _label,
  value,
  trend,
  deltaDirection,
  icon: Icon,
}: BentoCardModuleProps & {
  label: string
  value: number
  trend: number
  deltaDirection: 'up' | 'down' | 'flat'
  icon: ComponentType<{ className?: string }>
}): React.JSX.Element {
  const formatValue = (v: number): string => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }

  const trendColor =
    deltaDirection === 'up'
      ? 'text-[var(--ns-color-success)]'
      : deltaDirection === 'down'
        ? 'text-[var(--ns-color-error)]'
        : 'text-[var(--ns-color-muted)]'

  return (
    <div className="flex h-full flex-col gap-2">
      {config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {config.title}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--ns-color-accent)]" />
        <span className="text-2xl font-semibold text-[var(--ns-color-text)]">
          {formatValue(value)}
        </span>
      </div>
      <div className={`text-sm ${trendColor}`}>
        {trend >= 0 ? '+' : ''}
        {trend.toFixed(1)}%
      </div>
    </div>
  )
}

function MetricMRRModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data } = useMetricsList()
  const mrr = data?.mrr ?? { value: 0, trend: 0, deltaDirection: 'flat' as const }
  return (
    <MetricCard
      {...props}
      label="MRR"
      value={mrr.value}
      trend={mrr.trend}
      deltaDirection={mrr.deltaDirection}
      icon={DollarSign}
    />
  )
}

function MetricChurnModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data } = useMetricsList()
  const churn = data?.churn ?? { value: 0, trend: 0, deltaDirection: 'flat' as const }
  return (
    <MetricCard
      {...props}
      label="Churn"
      value={churn.value}
      trend={churn.trend}
      deltaDirection={churn.deltaDirection}
      icon={TrendingDown}
    />
  )
}

function MetricUsersModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data } = useMetricsList()
  const users = data?.activeUsers ?? {
    value: 0,
    trend: 0,
    deltaDirection: 'flat' as const,
  }
  return (
    <MetricCard
      {...props}
      label="Active Users"
      value={users.value}
      trend={users.trend}
      deltaDirection={users.deltaDirection}
      icon={Users}
    />
  )
}

function ChartRevenueModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useMetricsList()
  return (
    <div className="flex h-full flex-col gap-2">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      <AreaChart
        data={data?.revenueHistory ?? []}
        loading={isLoading ?? false}
        height={200}
      />
    </div>
  )
}

function ChartPipelineModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useMetricsList()
  return (
    <div className="flex h-full flex-col gap-2">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      <DonutChart
        data={data?.pipelineStages ?? []}
        loading={isLoading ?? false}
        height={180}
      />
    </div>
  )
}

function ChartActivityModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useMetricsList()
  return (
    <div className="flex h-full flex-col gap-2">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      <HeatmapChart
        data={data?.activityHeatmap ?? []}
        loading={isLoading ?? false}
        height={160}
      />
    </div>
  )
}

function ActivityFeedModule(props: BentoCardModuleProps): React.JSX.Element {
  const events = [
    { id: '1', msg: 'New signup: acme@example.com', time: '2m ago' },
    { id: '2', msg: 'MRR updated', time: '5m ago' },
    { id: '3', msg: 'Pipeline stage changed', time: '12m ago' },
  ]
  return (
    <div className="flex h-full flex-col gap-2">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {events.map((e) => (
          <div
            key={e.id}
            className="rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-3 py-2 text-sm"
          >
            <div className="text-[var(--ns-color-text)]">{e.msg}</div>
            <div className="text-xs text-[var(--ns-color-muted)]">{e.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnomalyBannerModule(props: BentoCardModuleProps): React.JSX.Element {
  const rawConfig = props.config.config
  const signals =
    rawConfig != null && Array.isArray(rawConfig['signals'])
      ? rawConfig['signals'].filter((s): s is string => typeof s === 'string')
      : []
  const hypothesis =
    rawConfig != null && typeof rawConfig['hypothesis'] === 'string'
      ? rawConfig['hypothesis']
      : null
  const confidence =
    rawConfig != null && typeof rawConfig['confidence'] === 'string'
      ? rawConfig['confidence']
      : null

  const hasExplanation = signals.length > 0 && hypothesis != null && confidence != null

  return (
    <div className="h-full border-[var(--ns-color-warning)]/50">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      {hasExplanation ? (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs text-[var(--ns-color-muted)]">Signals</div>
            <div className="text-sm text-[var(--ns-color-text)]">
              {signals.join(', ')}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--ns-color-muted)]">Hypothesis</div>
            <div className="text-sm text-[var(--ns-color-text)]">{hypothesis}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--ns-color-muted)]">Confidence</div>
            <div className="text-sm text-[var(--ns-color-text)]">{confidence}</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--ns-color-text)]">
          Churn signal detected. Review pipeline stall in negotiation stage.
        </div>
      )}
    </div>
  )
}

function ChartSparklineModule(props: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useMetricsList()
  return (
    <div className="flex h-full flex-col gap-2">
      {props.config.title ? (
        <div className="text-sm font-medium text-[var(--ns-color-muted)]">
          {props.config.title}
        </div>
      ) : null}
      <SparklineChart
        data={data?.sparklineData ?? []}
        loading={isLoading ?? false}
        height={80}
      />
    </div>
  )
}

export const MODULE_REGISTRY: BentoModuleRegistry = {
  'metric-mrr': MetricMRRModule,
  'metric-churn': MetricChurnModule,
  'metric-users': MetricUsersModule,
  'chart-revenue': ChartRevenueModule,
  'chart-pipeline': ChartPipelineModule,
  'chart-activity': ChartActivityModule,
  'chart-sparkline': ChartSparklineModule,
  'activity-feed': ActivityFeedModule,
  'anomaly-banner': AnomalyBannerModule,
}
