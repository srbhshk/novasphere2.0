import { db } from '@novasphere/db'
import type { Organization, TenantConfig as DbTenantConfig } from '@novasphere/db'

import { DEFAULT_FEATURE_FLAGS, DEFAULT_NAV_ITEMS, FALLBACK_TENANT } from './tenant.types'
import type { FeatureFlags, TenantConfig, TenantNavItem } from './tenant.types'

export class TenantNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TenantNotFoundError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function fromDb(org: Organization, cfg: DbTenantConfig | undefined): TenantConfig {
  const features = parseJson<Partial<FeatureFlags>>(cfg?.features ?? '{}', {})
  const navItems = parseJson<TenantNavItem[]>(cfg?.navItems ?? '[]', DEFAULT_NAV_ITEMS)

  const base: TenantConfig = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    features: {
      ...DEFAULT_FEATURE_FLAGS,
      ...features,
    },
    navItems,
  }

  return {
    ...base,
    ...(org.logoUrl ? { logoUrl: org.logoUrl } : {}),
    ...(org.accentColor ? { accentColor: org.accentColor } : {}),
  }
}

/**
 * Resolve tenant by organization id.
 * When `DATABASE_URL` is set, the DB is queried first so `organization.name` is used
 * even if `NEXT_PUBLIC_DATA_SOURCE` is still `mock` (common in local dev).
 */
export async function resolveTenant(organizationId: string): Promise<TenantConfig> {
  if (process.env['DATABASE_URL']) {
    const org = await db.query.organizations.findFirst({
      where: (t, { eq }) => eq(t.id, organizationId),
    })
    if (org) {
      const cfg = await db.query.tenantConfigs.findFirst({
        where: (t, { eq }) => eq(t.organizationId, org.id),
      })
      return fromDb(org, cfg)
    }
  }

  const dataSource =
    process.env['DATA_SOURCE'] ?? process.env['NEXT_PUBLIC_DATA_SOURCE'] ?? 'mock'
  if (dataSource === 'mock' || !process.env['DATABASE_URL']) {
    return { ...FALLBACK_TENANT, id: organizationId }
  }

  throw new TenantNotFoundError(
    `[novasphere/tenant-core] Tenant not found: ${organizationId}`,
  )
}

/**
 * Resolve tenant by URL slug (e.g. `/demo/dashboard` → slug `demo`).
 * Prefer this for shell UI so the id matches seeded rows (`org_demo`) while routes use `demo`.
 */
export async function resolveTenantBySlug(slug: string): Promise<TenantConfig> {
  if (process.env['DATABASE_URL']) {
    const org = await db.query.organizations.findFirst({
      where: (t, { eq }) => eq(t.slug, slug),
    })
    if (org) {
      const cfg = await db.query.tenantConfigs.findFirst({
        where: (t, { eq }) => eq(t.organizationId, org.id),
      })
      return fromDb(org, cfg)
    }
  }

  const dataSource =
    process.env['DATA_SOURCE'] ?? process.env['NEXT_PUBLIC_DATA_SOURCE'] ?? 'mock'
  if (dataSource === 'mock' || !process.env['DATABASE_URL']) {
    return { ...FALLBACK_TENANT, slug }
  }

  throw new TenantNotFoundError(
    `[novasphere/tenant-core] Tenant not found for slug: ${slug}`,
  )
}
