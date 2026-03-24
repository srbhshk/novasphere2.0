'use client'

import type { BentoCardModuleProps } from '@novasphere/ui-bento'
import {
  AreaChart,
  BarChart,
  DonutChart,
  HeatmapChart,
  SparklineChart,
} from '@novasphere/ui-charts'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import type {
  CeoMetricsResponse,
  EngineerMetricsResponse,
  AdminMetricsResponse,
} from '@/mocks/mock.types'
import { ModuleWrapper } from './ModuleWrapper'

// --- CEO chart modules ---

export function ChartRevenueComparisonModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const r = role === 'engineer' ? 'ceo' : role
  const { data, isLoading } = useDashboardMetrics(r === 'viewer' ? 'viewer' : r)
  const history = (data as CeoMetricsResponse | undefined)?.revenueHistory ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Revenue vs Prior Year'}>
      <AreaChart data={history} loading={isLoading} height={200} />
    </ModuleWrapper>
  )
}

export function ChartRevenueModule({ config }: BentoCardModuleProps): React.JSX.Element {
  return <ChartRevenueComparisonModule config={config} />
}

export function ChartChurnTrendModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const trend = (data as CeoMetricsResponse | undefined)?.churnTrend ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Churn Trend'}>
      <SparklineChart data={trend} loading={isLoading} height={120} />
    </ModuleWrapper>
  )
}

export function ChartUserGrowthModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const r = role === 'engineer' || role === 'viewer' ? 'admin' : role
  const { data, isLoading } = useDashboardMetrics(r)
  const growth =
    (data as CeoMetricsResponse | undefined)?.userGrowth ??
    (data as AdminMetricsResponse | undefined)?.userGrowth ??
    []
  return (
    <ModuleWrapper title={config.title ?? 'User Growth'}>
      <AreaChart data={growth} loading={isLoading} height={200} />
    </ModuleWrapper>
  )
}

export function ChartTopCustomersModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role === 'engineer' ? 'ceo' : role)
  const customers =
    (data as CeoMetricsResponse | undefined)?.topCustomers?.slice(0, 8) ?? []
  const barData = customers.map((c) => ({
    label: c.name.split(' ')[0] ?? c.name,
    value: c.mrr,
  }))
  return (
    <ModuleWrapper title={config.title ?? 'Top Customers by MRR'}>
      <BarChart
        data={barData}
        loading={isLoading}
        height={200}
        orientation="horizontal"
      />
    </ModuleWrapper>
  )
}

export function ChartPipelineModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const r = role === 'engineer' ? 'ceo' : role
  const { data, isLoading } = useDashboardMetrics(r === 'viewer' ? 'viewer' : r)
  const pipeline = (data as CeoMetricsResponse | undefined)?.pipelineByStage ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Pipeline by Stage'}>
      <DonutChart data={pipeline} loading={isLoading} height={180} />
    </ModuleWrapper>
  )
}

export function ChartPlanDistributionModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('admin')
  const plan = (data as AdminMetricsResponse | undefined)?.planDistribution ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Plan Distribution'}>
      <DonutChart data={plan} loading={isLoading} height={180} />
    </ModuleWrapper>
  )
}

export function ChartFeatureAdoptionModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('admin')
  const features = (data as AdminMetricsResponse | undefined)?.featureAdoption ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Feature Adoption'}>
      <BarChart
        data={features}
        loading={isLoading}
        height={200}
        orientation="horizontal"
      />
    </ModuleWrapper>
  )
}

// --- Engineer chart modules ---

export function ChartResponseTimeModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const trend = (data as EngineerMetricsResponse | undefined)?.responseTimeTrend ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Response Time (24h)'}>
      <AreaChart data={trend} loading={isLoading} height={200} />
    </ModuleWrapper>
  )
}

export function ChartErrorBreakdownModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const errors = (data as EngineerMetricsResponse | undefined)?.errorBreakdown ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Errors by Endpoint'}>
      <BarChart data={errors} loading={isLoading} height={200} orientation="horizontal" />
    </ModuleWrapper>
  )
}

export function ChartActivityModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { data, isLoading } = useDashboardMetrics('engineer')
  const heatmap = (data as EngineerMetricsResponse | undefined)?.activityHeatmap ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Activity Heatmap'}>
      <HeatmapChart data={heatmap} loading={isLoading} height={160} />
    </ModuleWrapper>
  )
}

export function ChartSparklineModule({
  config,
}: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useDashboardMetrics(role)
  const kpis = (data as { kpis?: { sparkline?: number[] }[] } | undefined)?.kpis
  const sparkline = kpis?.[0]?.sparkline?.map((v) => ({ value: v })) ?? []
  return (
    <ModuleWrapper title={config.title ?? 'Trend'}>
      <SparklineChart data={sparkline} loading={isLoading} height={80} />
    </ModuleWrapper>
  )
}
