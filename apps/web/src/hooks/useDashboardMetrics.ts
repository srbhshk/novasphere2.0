import { useQuery } from '@tanstack/react-query'
import type {
  CeoMetricsResponse,
  EngineerMetricsResponse,
  AdminMetricsResponse,
  ViewerMetricsResponse,
} from '@/mocks/mock.types'
import type { AgentRole } from './useCurrentRole'

type MetricsByRole = {
  ceo: CeoMetricsResponse
  engineer: EngineerMetricsResponse
  admin: AdminMetricsResponse
  viewer: ViewerMetricsResponse
}

export type DashboardMetricsResult<R extends AgentRole = AgentRole> = MetricsByRole[R]

async function fetchMetrics<R extends AgentRole>(role: R): Promise<MetricsByRole[R]> {
  const res = await fetch('/api/metrics', {
    headers: { 'x-user-role': role },
  })
  if (!res.ok) throw new Error('Failed to fetch metrics')
  return res.json() as Promise<MetricsByRole[R]>
}

export function useDashboardMetrics<R extends AgentRole>(
  role: R,
  enabled = true,
): ReturnType<typeof useQuery<MetricsByRole[R]>> {
  return useQuery<MetricsByRole[R]>({
    queryKey: ['dashboard-metrics', role],
    queryFn: () => fetchMetrics(role),
    staleTime: 60_000,
    enabled,
  })
}
