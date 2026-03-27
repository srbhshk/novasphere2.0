import type {
  AgentContext,
  BentoCardConfig,
  MetricSnapshot,
  ActivityEvent,
  TenantPlan,
  UserPreferences,
  UserRole,
} from '@novasphere/agent-core'
import { getUserPreferenceByUserId } from '@novasphere/db'
import {
  UI_CONTRACT_STATUS,
  allowedFallbackForIntent,
  classifyUiIntent,
  requiresToolForIntent,
} from '@novasphere/agent-core'
import { z } from 'zod'
import { novaConfig } from '../../../../../nova.config'
import { writeAgentLog } from './observability'

type BuildAgentContextInput = {
  headers: Headers
  userMessage: string
  conversationHistory: string
  currentRoute: string
}

const ROLE_FALLBACK: UserRole = 'viewer'
const TENANT_PLAN_FALLBACK: TenantPlan = 'free'
const ACTIVITY_LIMIT = 10

const kpiMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  trend: z.number(),
  deltaDirection: z.enum(['up', 'down', 'flat']),
  anomaly: z.boolean().optional(),
})

const metricsResponseSchema = z.object({
  kpis: z.array(kpiMetricSchema),
})

const activityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  message: z.string(),
  timestamp: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
})

const activityResponseSchema = z.object({
  items: z.array(activityItemSchema),
})

const pipelineDealSchema = z.object({
  id: z.string(),
  value: z.number(),
  stage: z.string(),
  probability: z.number(),
})

const pipelineResponseSchema = z.object({
  items: z.array(pipelineDealSchema),
})

const systemHealthResponseSchema = z.object({
  alerts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(['info', 'warning', 'critical']),
      resolved: z.boolean(),
    }),
  ),
})

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

function safeParseVisibleCards(value: string | null): BentoCardConfig[] {
  if (!value) {
    return []
  }

  const schema = z.array(
    z.object({
      id: z.string(),
      colSpan: z.number(),
      rowSpan: z.number(),
      moduleId: z.string(),
      title: z.string().optional(),
      visible: z.boolean(),
      order: z.number(),
      config: z.record(z.string(), z.unknown()).optional(),
    }),
  )

  try {
    const parsed: unknown = JSON.parse(value)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      return []
    }
    return result.data.map((card) => ({
      id: card.id,
      colSpan: card.colSpan,
      rowSpan: card.rowSpan,
      moduleId: card.moduleId,
      visible: card.visible,
      order: card.order,
      ...(card.title !== undefined ? { title: card.title } : {}),
      ...(card.config !== undefined ? { config: card.config } : {}),
    }))
  } catch {
    return []
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

function readOrigin(headers: Headers): string {
  const forwardedProto = headers.get('x-forwarded-proto')
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (host) {
    const proto =
      forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : 'http'
    return `${proto}://${host}`
  }
  return process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
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

type DashboardData = {
  activeMetrics: MetricSnapshot[]
  recentActivity: ActivityEvent[]
  criticalInsights: string[]
  contextDegraded: boolean
}

type CanonicalIdentity = {
  userId: string
  userRole: UserRole
  tenantId: string
}

function buildCanonicalIdentity(headers: Headers): CanonicalIdentity {
  const userId = readUserId(headers)
  const tenantId = readTenantId(headers)
  const userRole = readRole(headers)
  return { userId, userRole, tenantId }
}

async function fetchJson(
  origin: string,
  path: string,
  identity: CanonicalIdentity,
): Promise<unknown | null> {
  try {
    const response = await fetch(`${origin}${path}`, {
      method: 'GET',
      headers: {
        'x-user-id': identity.userId,
        'x-user-role': identity.userRole,
        'x-tenant-id': identity.tenantId,
      },
      cache: 'no-store',
    })
    if (!response.ok) {
      writeAgentLog({
        event: 'agent_context_endpoint_degraded',
        path,
        status: response.status,
        role: identity.userRole,
        tenantId: identity.tenantId,
      })
      return null
    }
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function deriveCriticalInsights(
  metrics: MetricSnapshot[],
  pipelineResponse: z.infer<typeof pipelineResponseSchema> | null,
  activity: ActivityEvent[],
  systemHealth: z.infer<typeof systemHealthResponseSchema> | null,
): string[] {
  const insights: string[] = []

  const anomalous = metrics.filter((m) => m.deltaDirection === 'up' && m.delta > 0)
  for (const metric of anomalous) {
    const lower = metric.label.toLowerCase()
    if (lower.includes('churn')) {
      insights.push(`Churn increasing: ${metric.label} is up ${metric.delta.toFixed(1)}.`)
    } else if (lower.includes('latency') || lower.includes('error')) {
      insights.push(
        `Reliability pressure: ${metric.label} increased by ${metric.delta.toFixed(1)}.`,
      )
    }
  }

  const downMetrics = metrics.filter((m) => m.deltaDirection === 'down' && m.delta < 0)
  for (const metric of downMetrics) {
    if (metric.label.toLowerCase().includes('conversion')) {
      insights.push(
        `Conversion softened: ${metric.label} is down ${Math.abs(metric.delta).toFixed(1)}.`,
      )
    }
  }

  if (pipelineResponse != null && pipelineResponse.items.length > 0) {
    const weightedValue = pipelineResponse.items.reduce(
      (sum, deal) => sum + (deal.value * deal.probability) / 100,
      0,
    )
    const negotiationCount = pipelineResponse.items.filter(
      (d) => d.stage === 'negotiation',
    ).length
    if (negotiationCount > 0) {
      insights.push(
        `Pipeline concentration: ${negotiationCount} deals in negotiation; weighted pipeline is ${Math.round(weightedValue)}.`,
      )
    }
  }

  const warningOrErrorEvents = activity.filter(
    (event) => event.severity === 'warning' || event.severity === 'error',
  )
  if (warningOrErrorEvents.length >= 2) {
    insights.push(
      `Operational risk: ${warningOrErrorEvents.length} recent warning/error events.`,
    )
  }

  if (systemHealth != null) {
    const activeAlerts = systemHealth.alerts.filter((a) => !a.resolved)
    const criticalActiveAlerts = activeAlerts.filter((a) => a.severity === 'critical')
    if (criticalActiveAlerts.length > 0) {
      insights.push(
        `Critical system alerts active: ${criticalActiveAlerts.map((a) => a.title).join(', ')}.`,
      )
    } else if (activeAlerts.length > 0) {
      insights.push(
        `Active system alerts: ${activeAlerts.length} unresolved alerts detected.`,
      )
    }
  }

  return insights.slice(0, 6)
}

async function resolveDashboardData(
  headers: Headers,
  identity: CanonicalIdentity,
): Promise<DashboardData> {
  const origin = readOrigin(headers)

  const [metricsRaw, pipelineRaw, activityRaw, systemHealthRaw] = await Promise.all([
    fetchJson(origin, '/api/metrics', identity),
    fetchJson(origin, '/api/pipeline?stage=all', identity),
    fetchJson(origin, `/api/activity?page=1&limit=${ACTIVITY_LIMIT}`, identity),
    fetchJson(origin, '/api/system-health', identity),
  ])

  const parsedMetrics = metricsResponseSchema.safeParse(metricsRaw)
  const parsedPipeline = pipelineResponseSchema.safeParse(pipelineRaw)
  const parsedActivity = activityResponseSchema.safeParse(activityRaw)
  const parsedSystemHealth = systemHealthResponseSchema.safeParse(systemHealthRaw)

  const activeMetrics: MetricSnapshot[] = parsedMetrics.success
    ? parsedMetrics.data.kpis.map((metric) => ({
        id: metric.id,
        label: metric.label,
        value: metric.value,
        delta: metric.trend,
        deltaDirection: metric.deltaDirection,
        trend: metric.deltaDirection === 'flat' ? 'stable' : metric.deltaDirection,
        anomaly: metric.anomaly ?? false,
      }))
    : buildEmptyMetrics()

  const recentActivity: ActivityEvent[] = parsedActivity.success
    ? parsedActivity.data.items.slice(0, ACTIVITY_LIMIT).map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        timestamp: new Date(event.timestamp).getTime(),
        ...(event.severity !== undefined ? { severity: event.severity } : {}),
      }))
    : buildEmptyActivity()

  const criticalInsights = deriveCriticalInsights(
    activeMetrics,
    parsedPipeline.success ? parsedPipeline.data : null,
    recentActivity,
    parsedSystemHealth.success ? parsedSystemHealth.data : null,
  )

  const metricsOk = parsedMetrics.success
  const activityOk = parsedActivity.success
  const pipelineOk = parsedPipeline.success
  const systemHealthOk = parsedSystemHealth.success

  // Degraded only when KPIs are missing, or when every supplementary feed failed.
  // Role-scoped partial data (e.g. empty pipeline for viewer, summary system-health for ceo)
  // still parses successfully and must not mark the contract as degraded.
  const supplementaryFailed = !activityOk && !pipelineOk && !systemHealthOk
  const contextDegraded = !metricsOk || supplementaryFailed

  return {
    activeMetrics,
    recentActivity,
    criticalInsights,
    contextDegraded,
  }
}

export async function buildAgentContext(
  input: BuildAgentContextInput,
): Promise<AgentContext> {
  const { headers, userMessage, conversationHistory, currentRoute } = input

  const tenantId = readTenantId(headers)
  const identity = buildCanonicalIdentity(headers)
  const userId = identity.userId
  const userRole = identity.userRole
  const visibleCards = safeParseVisibleCards(headers.get('x-visible-cards'))
  const uiIntent = classifyUiIntent(userMessage)
  const uiContract = {
    intent: uiIntent,
    requiresTool: requiresToolForIntent(uiIntent),
    allowedFallback: allowedFallbackForIntent(uiIntent),
  } as const

  const [tenantPlan, permissions, preferences, dashboardData] = await Promise.all([
    resolveTenantPlan(tenantId),
    resolvePermissions(tenantId, userId),
    resolvePreferences(tenantId, userId, userRole),
    resolveDashboardData(headers, identity),
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
    visibleCards,
    activeMetrics: dashboardData.activeMetrics,
    recentActivity: dashboardData.recentActivity,
    criticalInsights: dashboardData.criticalInsights,
    userMessage,
    conversationHistory,
    userPreferences: preferences,
    uiContract,
    uiContractResult: {
      ...uiContract,
      toolDetected: false,
      status: dashboardData.contextDegraded
        ? UI_CONTRACT_STATUS.warnViolation
        : UI_CONTRACT_STATUS.compliant,
      ...(dashboardData.contextDegraded ? { violationReason: 'context_degraded' } : {}),
    },
  }
}
