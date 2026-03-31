import { useQuery } from '@tanstack/react-query'
import type { EngineerMetricsResponse, SystemAlert } from '@/lib/api/contracts'
import type { AgentRole } from './useCurrentRole'

type SystemHealthResponse = Pick<
  EngineerMetricsResponse,
  'kpis' | 'responseTimeTrend' | 'errorBreakdown' | 'cpuSparkline' | 'memorySparkline'
> & { alerts: SystemAlert[] }

async function fetchSystemHealth(role: AgentRole): Promise<SystemHealthResponse> {
  const res = await fetch('/api/system-health', {
    headers: { 'x-user-role': role },
  })
  if (!res.ok) throw new Error('Failed to fetch system health')
  return res.json() as Promise<SystemHealthResponse>
}

export function useSystemHealth(
  role: AgentRole,
): ReturnType<typeof useQuery<SystemHealthResponse>> {
  const enabled = role === 'engineer' || role === 'admin'
  return useQuery<SystemHealthResponse>({
    queryKey: ['system-health', role],
    queryFn: () => fetchSystemHealth(role),
    staleTime: 15_000,
    enabled,
  })
}
