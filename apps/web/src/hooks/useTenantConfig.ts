import { useQuery } from '@tanstack/react-query'
import type { TenantConfig } from '@novasphere/tenant-core'

async function fetchTenantConfig(tenantId: string): Promise<TenantConfig> {
  const res = await fetch(`/api/tenant?tenantId=${encodeURIComponent(tenantId)}`)
  if (!res.ok) {
    throw new Error('Failed to fetch tenant config')
  }
  return res.json() as Promise<TenantConfig>
}

export function useTenantConfig(
  tenantId: string | null,
): ReturnType<typeof useQuery<TenantConfig>> {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenantConfig(tenantId ?? 'demo'),
    enabled: tenantId != null && tenantId.length > 0,
    staleTime: 5 * 60_000,
  })
}
