import { describe, expect, it } from 'vitest'

import { getBreadcrumbs } from '../breadcrumb.resolver'
import { FALLBACK_TENANT } from '../tenant.types'

describe('getBreadcrumbs', () => {
  it("returns correct items for '/demo/dashboard'", () => {
    const tenant = FALLBACK_TENANT
    const items = getBreadcrumbs('/demo/dashboard', tenant)

    expect(items[0]).toEqual({ label: tenant.name, href: '/demo/dashboard' })
    expect(items.map((i) => i.label)).toEqual([tenant.name, 'Dashboard'])
  })

  it("matches analytics nav item label for '/demo/analytics'", () => {
    const tenant = FALLBACK_TENANT
    const items = getBreadcrumbs('/demo/analytics', tenant)

    expect(items[0]).toEqual({ label: tenant.name, href: '/demo/dashboard' })
    expect(items.map((i) => i.label)).toEqual([tenant.name, 'Analytics'])
  })

  it('capitalises unknown segments', () => {
    const tenant = FALLBACK_TENANT
    const items = getBreadcrumbs('/demo/error_rates/last-24h', tenant)

    expect(items[0]).toEqual({ label: tenant.name, href: '/demo/dashboard' })
    expect(items.map((i) => i.label)).toEqual([tenant.name, 'Error Rates', 'Last 24h'])
  })

  it('always starts with tenant name', () => {
    const tenant = FALLBACK_TENANT
    const items = getBreadcrumbs('/demo/settings', tenant)

    expect(items[0]?.label).toBe(tenant.name)
  })
})
