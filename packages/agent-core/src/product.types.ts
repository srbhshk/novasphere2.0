export type RoleContext = {
  admin: string
  ceo: string
  engineer: string
  viewer: string
}

export type ProductConfig = {
  name: string
  domain: string
  description: string
  primaryMetrics: string[]
  criticalSignals: string[]
  terminology: Record<string, string>
  roleContext: RoleContext
}
