import type { TenantConfig } from './tenant.types'

export type BreadcrumbItem = {
  label: string
  href: string
}

function toTitleCase(raw: string): string {
  const cleaned = raw.replace(/[-_]+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
}

export function getBreadcrumbs(pathname: string, tenant: TenantConfig): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const tenantRootHref = `/${tenant.slug}/dashboard`

  const items: BreadcrumbItem[] = [{ label: tenant.name, href: tenantRootHref }]

  let currentHref = ''
  for (const segment of segments) {
    currentHref += `/${segment}`

    if (segment === tenant.slug) continue

    const navMatch = tenant.navItems.find((n) => n.href.replace(/^\//, '') === segment)
    if (navMatch) {
      items.push({ label: navMatch.label, href: currentHref })
      continue
    }

    const label = toTitleCase(segment)
    if (label) items.push({ label, href: currentHref })
  }

  return items
}
