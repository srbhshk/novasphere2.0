import type {
  AgentContext,
  MetricSnapshot,
  ActivityEvent,
  TenantPlan,
  UserPreferences,
  UserRole,
} from '@novasphere/agent-core'
import { getUserPreferenceByUserId } from '@novasphere/db'
import { novaConfig } from '../../../../../nova.config'

type BuildAgentContextInput = {
  headers: Headers
  userMessage: string
  conversationHistory: string
  currentRoute: string
}

const ROLE_FALLBACK: UserRole = 'viewer'
const TENANT_PLAN_FALLBACK: TenantPlan = 'free'

function safeParseJsonArray(value: string | null): string[] | undefined {
  if (!value) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return undefined
    }
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return undefined
  }
}

function readRole(headers: Headers): UserRole {
  const role = headers.get('x-user-role')
  if (role === 'admin' || role === 'ceo' || role === 'engineer' || role === 'viewer') {
    return role
  }
  return ROLE_FALLBACK
}

function readTenantId(headers: Headers): string {
  return headers.get('x-tenant-id') ?? 'demo'
}

function readUserId(headers: Headers): string {
  return headers.get('x-user-id') ?? 'anonymous'
}

async function resolveTenantPlan(tenantId: string): Promise<TenantPlan> {
  if (tenantId === 'demo') {
    return 'pro'
  }
  return TENANT_PLAN_FALLBACK
}

async function resolvePermissions(tenantId: string, userId: string): Promise<string[]> {
  if (tenantId.length === 0 || userId.length === 0) return []
  return []
}

async function resolvePreferences(
  tenantId: string,
  userId: string,
  userRole: UserRole,
): Promise<UserPreferences> {
  const base: UserPreferences = { defaultRole: userRole }
  if (tenantId.length === 0 || userId.length === 0) {
    return base
  }
  if (userId === 'anonymous') {
    return base
  }

  try {
    const row = await getUserPreferenceByUserId(userId)
    if (row == null) {
      return base
    }
    if (typeof row.dashboardGoal === 'string' && row.dashboardGoal.length > 0) {
      base.dashboardGoal = row.dashboardGoal
    }
    const pinned = safeParseJsonArray(row.pinnedModuleIds)
    if (pinned) {
      base.pinnedModuleIds = pinned
    }
    const hidden = safeParseJsonArray(row.hiddenModuleIds)
    if (hidden) {
      base.hiddenModuleIds = hidden
    }
    if (typeof row.aiPersona === 'string' && row.aiPersona.length > 0) {
      base.aiPersona = row.aiPersona
    }
    if (typeof row.themePreset === 'string' && row.themePreset.length > 0) {
      base.themePreset = row.themePreset
    }
  } catch {
    return base
  }

  return base
}

function buildEmptyMetrics(): MetricSnapshot[] {
  return []
}

function buildEmptyActivity(): ActivityEvent[] {
  return []
}

export async function buildAgentContext(
  input: BuildAgentContextInput,
): Promise<AgentContext> {
  const { headers, userMessage, conversationHistory, currentRoute } = input

  const tenantId = readTenantId(headers)
  const userId = readUserId(headers)
  const userRole = readRole(headers)

  const [tenantPlan, permissions, preferences] = await Promise.all([
    resolveTenantPlan(tenantId),
    resolvePermissions(tenantId, userId),
    resolvePreferences(tenantId, userId, userRole),
  ])

  return {
    tenantId,
    tenantPlan,
    userId,
    userRole,
    permissions,
    productName: novaConfig.product.name,
    productDomain: novaConfig.product.domain,
    productDescription: novaConfig.product.description,
    roleInProduct: novaConfig.product.roleContext[userRole],
    criticalSignals: [...novaConfig.product.criticalSignals],
    currentRoute,
    visibleCards: [],
    activeMetrics: buildEmptyMetrics(),
    recentActivity: buildEmptyActivity(),
    userMessage,
    conversationHistory,
    userPreferences: preferences,
  }
}
