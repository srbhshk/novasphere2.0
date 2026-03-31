import { useQuery } from '@tanstack/react-query'
import type { PaginatedResponse, CustomerRow } from '@/lib/api/contracts'
import type { AgentRole } from './useCurrentRole'

type CustomerListParams = {
  page?: number
  limit?: number
  sort?: 'mrr' | 'risk' | 'name'
  risk?: 'all' | 'low' | 'medium' | 'high' | 'critical'
  role: AgentRole
}

async function fetchCustomers(
  params: CustomerListParams,
): Promise<PaginatedResponse<CustomerRow>> {
  const url = new URL('/api/customers', window.location.origin)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('limit', String(params.limit ?? 20))
  url.searchParams.set('sort', params.sort ?? 'mrr')
  url.searchParams.set('risk', params.risk ?? 'all')

  const res = await fetch(url.toString(), {
    headers: { 'x-user-role': params.role },
  })
  if (!res.ok) throw new Error('Failed to fetch customers')
  return res.json() as Promise<PaginatedResponse<CustomerRow>>
}

export function useCustomerList(
  params: CustomerListParams,
): ReturnType<typeof useQuery<PaginatedResponse<CustomerRow>>> {
  const enabled = params.role === 'ceo' || params.role === 'admin'
  return useQuery<PaginatedResponse<CustomerRow>>({
    queryKey: [
      'customers',
      params.role,
      params.page,
      params.limit,
      params.sort,
      params.risk,
    ],
    queryFn: () => fetchCustomers(params),
    staleTime: 60_000,
    enabled,
  })
}
