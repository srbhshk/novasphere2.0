import type { TenantPlan } from '@novasphere/db'

export type TenantNavItem = {
  id: string
  label: string
  icon: string
  href: string
  badge?: string
}

export type FeatureFlags = {
  bentoReorder: boolean
  generativeLayout: boolean
  multiTenant: boolean
  authEnabled: boolean
}

export type TenantConfig = {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  logoUrl?: string
  accentColor?: string
  features: FeatureFlags
  navItems: TenantNavItem[]
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  bentoReorder: true,
  generativeLayout: true,
  multiTenant: true,
  authEnabled: true,
}

export const DEFAULT_NAV_ITEMS: TenantNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'LineChart', href: '/analytics' },
  { id: 'pipelines', label: 'Pipelines', icon: 'GitBranch', href: '/pipelines' },
  { id: 'agents', label: 'Agents', icon: 'Bot', href: '/agents' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
]

export const FALLBACK_TENANT: TenantConfig = {
  id: 'demo',
  name: 'novasphere Demo',
  slug: 'demo',
  plan: 'pro',
  features: DEFAULT_FEATURE_FLAGS,
  navItems: DEFAULT_NAV_ITEMS,
}
