import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import type { HeatmapCell } from '@novasphere/ui-charts'
import {
  MOCK_MRR,
  MOCK_CHURN,
  MOCK_ACTIVE_USERS,
  MOCK_REVENUE_HISTORY,
  MOCK_PIPELINE_STAGES,
  MOCK_ACTIVITY_HEATMAP,
  MOCK_SPARKLINE_DATA,
} from '@/mocks/metrics.mock'

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

async function fetchMetricsFromApi(): Promise<MetricsListResult> {
  const res = await fetch('/api/metrics')
  if (!res.ok) {
    throw new Error('Failed to fetch metrics')
  }
  return res.json() as Promise<MetricsListResult>
}

function getMockMetrics(): MetricsListResult {
  return {
    mrr: MOCK_MRR,
    churn: MOCK_CHURN,
    activeUsers: MOCK_ACTIVE_USERS,
    revenueHistory: MOCK_REVENUE_HISTORY,
    pipelineStages: MOCK_PIPELINE_STAGES,
    activityHeatmap: MOCK_ACTIVITY_HEATMAP,
    sparklineData: MOCK_SPARKLINE_DATA,
  }
}

export function useMetricsList(): ReturnType<typeof useQuery<MetricsListResult>> {
  const dataSource = env.NEXT_PUBLIC_DATA_SOURCE

  return useQuery({
    queryKey: ['metrics', dataSource],
    queryFn: dataSource === 'api' ? fetchMetricsFromApi : getMockMetrics,
    staleTime: 60_000,
  })
}
