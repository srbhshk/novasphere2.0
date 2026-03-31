import { useQuery } from '@tanstack/react-query'
import type { HeatmapCell } from '@novasphere/ui-charts'
import type { KpiMetric } from '@/lib/api/contracts'

export type MetricsListResult = {
  mrr: {
    value: number
    trend: number
    deltaDirection: 'up' | 'down' | 'flat'
    anomaly?: boolean
  }
  churn: {
    value: number
    trend: number
    deltaDirection: 'up' | 'down' | 'flat'
    anomaly?: boolean
  }
  activeUsers: {
    value: number
    trend: number
    deltaDirection: 'up' | 'down' | 'flat'
    anomaly?: boolean
  }
  revenueHistory: Array<{ label: string; value: number; value2?: number }>
  pipelineStages: Array<{ id: string; label: string; value: number }>
  activityHeatmap: HeatmapCell[]
  sparklineData: Array<{ value: number; label?: string }>
}

function findKpi(kpis: KpiMetric[], id: string): KpiMetric | undefined {
  return kpis.find((k) => k.id === id)
}

function kpiToMetric(kpi: KpiMetric | undefined): MetricsListResult['mrr'] {
  if (kpi == null) {
    return {
      value: 0,
      trend: 0,
      deltaDirection: 'flat',
    }
  }
  const dir =
    kpi.deltaDirection === 'up' ? 'up' : kpi.deltaDirection === 'down' ? 'down' : 'flat'
  return {
    value: kpi.value,
    trend: kpi.trend,
    deltaDirection: dir,
    ...(kpi.anomaly === true ? { anomaly: true } : {}),
  }
}

async function fetchMetrics(role: string): Promise<MetricsListResult> {
  const res = await fetch('/api/metrics', {
    headers: { 'x-user-role': role },
  })
  if (!res.ok) throw new Error('Failed to fetch metrics')

  const data = (await res.json()) as { kpis?: KpiMetric[] } & Record<string, unknown>
  const kpis: KpiMetric[] = Array.isArray(data.kpis) ? data.kpis : []

  const revenueHistory = Array.isArray(data['revenueHistory'])
    ? (data['revenueHistory'] as MetricsListResult['revenueHistory'])
    : []
  const pipelineStages = Array.isArray(data['pipelineByStage'])
    ? (data['pipelineByStage'] as MetricsListResult['pipelineStages'])
    : []
  const activityHeatmap = Array.isArray(data['activityHeatmap'])
    ? (data['activityHeatmap'] as MetricsListResult['activityHeatmap'])
    : []

  const mrr = kpiToMetric(findKpi(kpis, 'mrr'))
  const churn = kpiToMetric(findKpi(kpis, 'churn'))
  const activeUsers = kpiToMetric(
    findKpi(kpis, 'total-users') ?? findKpi(kpis, 'active-users'),
  )
  const sparklineFromKpi = findKpi(kpis, 'mrr')?.sparkline
  const sparklineData = Array.isArray(sparklineFromKpi)
    ? sparklineFromKpi.map((value, index) => ({
        value,
        label: `${index + 1}`,
      }))
    : []

  return {
    mrr,
    churn,
    activeUsers,
    revenueHistory,
    pipelineStages,
    activityHeatmap,
    sparklineData,
  }
}

export function useMetricsList(
  role = 'viewer',
): ReturnType<typeof useQuery<MetricsListResult>> {
  return useQuery({
    queryKey: ['metrics-list', role],
    queryFn: () => fetchMetrics(role),
    staleTime: 60_000,
  })
}
