import { useQuery } from '@tanstack/react-query'
import type { PaginatedResponse, PipelineDeal } from '@/mocks/mock.types'
import type { AgentRole } from './useCurrentRole'

type PipelineParams = {
  stage?:
    | 'all'
    | 'discovery'
    | 'qualification'
    | 'proposal'
    | 'negotiation'
    | 'closed-won'
  role: AgentRole
}

async function fetchPipelineDeals(
  params: PipelineParams,
): Promise<PaginatedResponse<PipelineDeal>> {
  const url = new URL('/api/pipeline', window.location.origin)
  url.searchParams.set('stage', params.stage ?? 'all')

  const res = await fetch(url.toString(), {
    headers: { 'x-user-role': params.role },
  })
  if (!res.ok) throw new Error('Failed to fetch pipeline deals')
  return res.json() as Promise<PaginatedResponse<PipelineDeal>>
}

export function usePipelineDeals(
  params: PipelineParams,
): ReturnType<typeof useQuery<PaginatedResponse<PipelineDeal>>> {
  const enabled = params.role === 'ceo' || params.role === 'admin'
  return useQuery<PaginatedResponse<PipelineDeal>>({
    queryKey: ['pipeline', params.role, params.stage],
    queryFn: () => fetchPipelineDeals(params),
    staleTime: 60_000,
    enabled,
  })
}
