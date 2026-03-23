import { headers } from 'next/headers'
import { resolveTenant } from '@novasphere/tenant-core'
import DashboardShell from './DashboardShell'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.JSX.Element> {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'demo'
  const tenant = await resolveTenant(tenantId)

  return <DashboardShell tenant={tenant}>{children}</DashboardShell>
}
