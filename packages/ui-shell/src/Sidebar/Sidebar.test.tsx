import { render, screen } from '@testing-library/react'

import type { TenantConfig } from '@novasphere/tenant-core'

import Sidebar from './Sidebar'

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
  navItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutGrid',
      href: '/demo/dashboard',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'BarChart3',
      href: '/demo/analytics',
      badge: '2',
    },
  ],
}

describe('Sidebar', () => {
  it('renders correct nav items from tenant', () => {
    render(<Sidebar tenant={tenant} currentPath="/demo/dashboard" />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/demo/dashboard')
    expect(hrefs).toContain('/demo/analytics')
  })

  it('marks currentPath as active', () => {
    render(<Sidebar tenant={tenant} currentPath="/demo/analytics" />)

    const analyticsLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/demo/analytics')

    expect(analyticsLink).toBeDefined()
    expect(analyticsLink?.className).toContain('ns-nav-item--active')
  })

  it('renders bottomSlot when provided', () => {
    render(
      <Sidebar
        tenant={tenant}
        currentPath="/demo/dashboard"
        bottomSlot={<div>BottomSlot</div>}
      />,
    )

    expect(screen.getByText('BottomSlot')).toBeInTheDocument()
  })
})
