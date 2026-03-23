import { db } from '@novasphere/db'
import type { Organization, TenantConfig as DbTenantConfig } from '@novasphere/db'

import { DEFAULT_FEATURE_FLAGS, DEFAULT_NAV_ITEMS, FALLBACK_TENANT } from './tenant.types'
import type { FeatureFlags, TenantConfig, TenantNavItem } from './tenant.types'

export class TenantNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = 'TenantNotFoundError'
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

export async function resolveTenant(organizationId: string): Promise<TenantConfig> {
  const dataSource = process.env['NEXT_PUBLIC_DATA_SOURCE'] ?? 'mock'
  if (dataSource === 'mock') {
    return { ...FALLBACK_TENANT, id: organizationId }
  }

  if (!process.env['DATABASE_URL']) {
    return { ...FALLBACK_TENANT, id: organizationId }
  }

  const org = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.id, organizationId),
  })

  if (!org) {
    throw new TenantNotFoundError(
      `[novasphere/tenant-core] Tenant not found: ${organizationId}`,
    )
  }

  const cfg = await db.query.tenantConfigs.findFirst({
    where: (t, { eq }) => eq(t.organizationId, org.id),
  })

  return fromDb(org, cfg)
}

export async function resolveTenantBySlug(slug: string): Promise<TenantConfig> {
  const dataSource = process.env['NEXT_PUBLIC_DATA_SOURCE'] ?? 'mock'
  if (dataSource === 'mock') {
    return { ...FALLBACK_TENANT, slug }
  }

  if (!process.env['DATABASE_URL']) {
    return { ...FALLBACK_TENANT, slug }
  }

  const org = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  })

  if (!org) {
    throw new TenantNotFoundError(
      `[novasphere/tenant-core] Tenant not found for slug: ${slug}`,
    )
  }

  const cfg = await db.query.tenantConfigs.findFirst({
    where: (t, { eq }) => eq(t.organizationId, org.id),
  })

  return fromDb(org, cfg)
}
