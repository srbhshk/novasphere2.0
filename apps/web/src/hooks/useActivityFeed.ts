import { useQuery } from '@tanstack/react-query'
import type { PaginatedResponse, ActivityEvent } from '@/mocks/mock.types'
import type { AgentRole } from './useCurrentRole'

type ActivityFeedParams = {
  page?: number
  limit?: number
  role: AgentRole
}

async function fetchActivity(
  params: ActivityFeedParams,
): Promise<PaginatedResponse<ActivityEvent>> {
  const url = new URL('/api/activity', window.location.origin)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('limit', String(params.limit ?? 20))

  const res = await fetch(url.toString(), {
    headers: { 'x-user-role': params.role },
  })
  if (!res.ok) throw new Error('Failed to fetch activity feed')
  return res.json() as Promise<PaginatedResponse<ActivityEvent>>
}

export function useActivityFeed(
  params: ActivityFeedParams,
): ReturnType<typeof useQuery<PaginatedResponse<ActivityEvent>>> {
  return useQuery<PaginatedResponse<ActivityEvent>>({
    queryKey: ['activity', params.role, params.page, params.limit],
    queryFn: () => fetchActivity(params),
    staleTime: 30_000,
  })
}
