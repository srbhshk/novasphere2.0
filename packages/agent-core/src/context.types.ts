import type {
  TenantPlan,
  UiActionContractDecision,
  UiActionContractResult,
  UserPreferences,
  UserRole,
} from './agent.types'
import type { ActivityEvent, MetricSnapshot } from './agent.types'

export type BentoCardConfig = {
  id: string
  colSpan: number
  rowSpan: number
  moduleId: string
  title?: string
  visible: boolean
  order: number
  config?: Record<string, unknown>
}

export type AgentContext = {
  tenantId: string
  tenantPlan: TenantPlan
  userId: string
  userRole: UserRole
  permissions: string[]
  productName: string
  productDomain: string
  productDescription: string
  roleInProduct: string
  criticalSignals: string[]
  currentRoute: string
  visibleCards: BentoCardConfig[]
  activeMetrics: MetricSnapshot[]
  recentActivity: ActivityEvent[]
  criticalInsights?: string[]
  userMessage: string
  conversationHistory: string
  userPreferences: UserPreferences
  uiContract?: UiActionContractDecision
  uiContractResult?: UiActionContractResult
}
