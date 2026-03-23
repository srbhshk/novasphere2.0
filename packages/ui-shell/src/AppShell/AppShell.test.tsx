import { render, screen } from '@testing-library/react'

import type { TenantConfig } from '@novasphere/tenant-core'

import AppShell from './AppShell'

const tenant: TenantConfig = {
  id: 'demo',
  name: 'novasphere Demo',
  slug: 'demo',
  plan: 'pro',
  accentColor: '#00ff99',
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
  ],
}

describe('AppShell', () => {
  it('renders children', () => {
    render(
      <AppShell tenant={tenant} currentPath="/demo/dashboard" title="Dashboard">
        <div>ShellContent</div>
      </AppShell>,
    )

    expect(screen.getByText('ShellContent')).toBeInTheDocument()
  })

  it('injects accentColor style override when tenant.accentColor set', () => {
    const { container } = render(
      <AppShell tenant={tenant} currentPath="/demo/dashboard" title="Dashboard">
        <div>ShellContent</div>
      </AppShell>,
    )

    const styleTags = Array.from(container.querySelectorAll('style'))
    const combinedStyleText = styleTags.map((tag) => tag.textContent ?? '').join('\n')

    expect(combinedStyleText).toContain('--ns-color-accent')
    expect(combinedStyleText).toContain('#00ff99')
  })
})
