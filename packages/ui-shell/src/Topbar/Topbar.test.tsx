import { render, screen } from '@testing-library/react'

import type { TenantConfig } from '@novasphere/tenant-core'

import Topbar from './Topbar'

const tenant: TenantConfig = {
  id: 'demo',
  name: 'novasphere Demo',
  slug: 'demo',
  plan: 'pro',
  features: {
    bentoReorder: true,
    generativeLayout: true,
    multiTenant: true,
    authEnabled: true,
  },
  navItems: [],
}

describe('Topbar', () => {
  it('renders title when breadcrumbs not provided', () => {
    render(<Topbar tenant={tenant} title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders breadcrumbs when provided', () => {
    render(
      <Topbar
        tenant={tenant}
        title="Ignored"
        breadcrumbs={[
          { label: 'Demo', href: '/demo/dashboard' },
          { label: 'Analytics', href: '/demo/analytics' },
        ]}
      />,
    )

    expect(screen.getByText('Demo')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders rightSlot when provided', () => {
    render(<Topbar tenant={tenant} title="Dashboard" rightSlot={<div>RightSlot</div>} />)

    expect(screen.getByText('RightSlot')).toBeInTheDocument()
  })
})
