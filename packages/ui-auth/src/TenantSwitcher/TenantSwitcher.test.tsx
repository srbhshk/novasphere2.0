import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TenantSwitcher } from './TenantSwitcher'
import type { TenantConfig } from '@novasphere/tenant-core'

const tenants: TenantConfig[] = [
  {
    id: 't1',
    name: 'Tenant One',
    slug: 'one',
    plan: 'pro',
    features: {
      bentoReorder: true,
      generativeLayout: true,
      multiTenant: true,
      authEnabled: true,
    },
    navItems: [],
  },
  {
    id: 't2',
    name: 'Tenant Two',
    slug: 'two',
    plan: 'free',
    features: {
      bentoReorder: true,
      generativeLayout: true,
      multiTenant: true,
      authEnabled: true,
    },
    navItems: [],
  },
]

describe('TenantSwitcher', () => {
  it('calls onSwitch(tenant.id) when tenant item is clicked', async () => {
    const user = userEvent.setup()
    const onSwitch = vi.fn()
    render(<TenantSwitcher tenants={tenants} currentTenantId="t1" onSwitch={onSwitch} />)
    const trigger = screen.getByRole('button', { name: /switch tenant/i })
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.getByText('Tenant Two')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Tenant Two'))
    expect(onSwitch).toHaveBeenCalledWith('t2')
  })
})
