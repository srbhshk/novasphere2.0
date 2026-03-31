import { notFound } from 'next/navigation'
import { resolveTenantBySlug, TenantNotFoundError } from '@novasphere/tenant-core'

import DashboardShell from '../DashboardShell'

type TenantLayoutProps = {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps): Promise<React.JSX.Element> {
  const { tenant: tenantSlug } = await params

  let tenant: Awaited<ReturnType<typeof resolveTenantBySlug>>
  try {
    tenant = await resolveTenantBySlug(tenantSlug)
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      notFound()
    }
    throw error
  }

  return <DashboardShell tenant={tenant}>{children}</DashboardShell>
}
