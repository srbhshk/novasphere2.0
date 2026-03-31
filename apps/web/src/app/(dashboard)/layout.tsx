import type { ReactNode } from 'react'

type DashboardLayoutProps = {
  children: ReactNode
}

/**
 * Tenant-specific shell (resolveTenant, breadcrumbs) lives in `[tenant]/layout.tsx`
 * so the slug in the URL drives `resolveTenantBySlug` (matches DB `organization.slug`).
 */
export default function DashboardLayout({ children }: DashboardLayoutProps): ReactNode {
  return children
}
