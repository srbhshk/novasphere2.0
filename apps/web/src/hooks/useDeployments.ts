import { useQuery } from '@tanstack/react-query'
import type { Deployment } from '@/mocks/mock.types'
import type { AgentRole } from './useCurrentRole'

type DeploymentsResponse = {
  items: Deployment[]
  total: number
}

type DeploymentParams = {
  role: AgentRole
  environment?: 'all' | 'production' | 'staging'
  status?: 'all' | 'success' | 'failed' | 'in_progress' | 'rolled_back'
  limit?: number
}

async function fetchDeployments(params: DeploymentParams): Promise<DeploymentsResponse> {
  const url = new URL('/api/deployments', window.location.origin)
  url.searchParams.set('environment', params.environment ?? 'all')
  url.searchParams.set('status', params.status ?? 'all')
  url.searchParams.set('limit', String(params.limit ?? 10))

  const res = await fetch(url.toString(), {
    headers: { 'x-user-role': params.role },
  })
  if (!res.ok) throw new Error('Failed to fetch deployments')
  return res.json() as Promise<DeploymentsResponse>
}

export function useDeployments(
  params: DeploymentParams,
): ReturnType<typeof useQuery<DeploymentsResponse>> {
  const enabled = params.role === 'engineer' || params.role === 'admin'
  return useQuery<DeploymentsResponse>({
    queryKey: [
      'deployments',
      params.role,
      params.environment,
      params.status,
      params.limit,
    ],
    queryFn: () => fetchDeployments(params),
    staleTime: 30_000,
    enabled,
  })
}
