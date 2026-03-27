import type { ModelMessage } from 'ai'
import { generateText, stepCountIs, streamText } from 'ai'
import type { AgentContext, ProductConfig, UserRole } from '@novasphere/agent-core'
import {
  buildInitialLayoutRoleHint,
  buildToolLoopInstructions,
  getSystemPrompt,
} from '@novasphere/agent-core'
import { z } from 'zod'
import { getActiveModel } from './models'
import { genUiTools } from './genui/tools'
import { writeAgentLog } from './observability'
import { novaConfig } from 'nova.config'

export const callOptionsSchema = z.object({
  userId: z.string(),
  userRole: z.enum(['admin', 'ceo', 'engineer', 'viewer']),
  tenantId: z.string(),
  tenantPlan: z.enum(['free', 'pro', 'enterprise']),
  productName: z.string(),
  productDomain: z.string(),
  productDescription: z.string(),
  roleInProduct: z.string(),
  criticalSignals: z.array(z.string()),
  dashboardGoal: z.string().optional(),
})

type AgentStreamInput =
  | {
      prompt: string
      messages?: never
      options: AgentContext
      forceRenderLayout?: boolean
      forceRenderLayoutRetry?: boolean
    }
  | {
      prompt?: never
      messages: ModelMessage[]
      options: AgentContext
      forceRenderLayout?: boolean
      forceRenderLayoutRetry?: boolean
    }

export function detectLayoutIntent(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  if (normalized.length === 0) return false

  const layoutPhrases = [
    'show me',
    'focus on',
    'optimize',
    'improve',
    'dashboard',
    'what matters',
    'prioritize',
    'surface',
    'reorder',
    'arrange',
  ] as const

  return layoutPhrases.some((phrase) => normalized.includes(phrase))
}

function toUserRole(value: string): UserRole {
  if (
    value === 'admin' ||
    value === 'ceo' ||
    value === 'engineer' ||
    value === 'viewer'
  ) {
    return value
  }
  return 'viewer'
}

function toProductConfig(context: AgentContext): ProductConfig {
  return {
    name: context.productName,
    domain: context.productDomain,
    description: context.productDescription,
    primaryMetrics: [...novaConfig.product.primaryMetrics],
    criticalSignals: context.criticalSignals,
    terminology: novaConfig.product.terminology,
    roleContext: novaConfig.product.roleContext,
  }
}

function formatMetricSignal(metric: AgentContext['activeMetrics'][number]): string {
  const hasUnit = metric.unit != null && metric.unit.length > 0
  const rawValue = hasUnit ? `${metric.value}${metric.unit}` : `${metric.value}`
  const deltaPrefix = metric.delta > 0 ? '+' : ''
  const anomalyTag = metric.anomaly === true ? ' [ANOMALY]' : ''
  return `${metric.label}: ${rawValue} (${deltaPrefix}${metric.delta}%, ${metric.deltaDirection})${anomalyTag}`
}

function summarizeContextForLLM(context: AgentContext): string {
  const prioritizedMetrics = [...context.activeMetrics]
    .sort((left, right) => {
      if (left.anomaly === true && right.anomaly !== true) return -1
      if (left.anomaly !== true && right.anomaly === true) return 1
      return Math.abs(right.delta) - Math.abs(left.delta)
    })
    .slice(0, 6)

  const keyMetricsSummary =
    prioritizedMetrics.length > 0
      ? prioritizedMetrics.map((metric) => `- ${formatMetricSignal(metric)}`).join('\n')
      : '- none'

  const anomalySignals = context.activeMetrics
    .filter((metric) => metric.anomaly === true)
    .map((metric) => `- ${metric.label}`)
  const anomaliesSummary =
    anomalySignals.length > 0 ? anomalySignals.join('\n') : '- none'

  const recentActivitySummary =
    context.recentActivity.length > 0
      ? context.recentActivity
          .slice(0, 5)
          .map((event) => {
            const severity =
              event.severity != null ? `${event.severity.toUpperCase()} · ` : ''
            return `- ${severity}${event.type}: ${event.message}`
          })
          .join('\n')
      : '- none'

  const insightsSummary =
    context.criticalInsights != null && context.criticalInsights.length > 0
      ? context.criticalInsights
          .slice(0, 5)
          .map((insight) => `- ${insight}`)
          .join('\n')
      : '- none'

  return [
    'CURRENT DATA STATE:',
    `- Key metrics:`,
    keyMetricsSummary,
    `- Anomalies:`,
    anomaliesSummary,
    `- Recent activity:`,
    recentActivitySummary,
    `- Insights:`,
    insightsSummary,
  ].join('\n')
}

function buildSystemInstructions(
  context: AgentContext,
  overrides?: { forceRenderLayout?: boolean; forceRenderLayoutRetry?: boolean },
): string {
  const product = toProductConfig(context)
  const role = toUserRole(context.userRole)

  const base = getSystemPrompt(role, product)
  const contextSummary = summarizeContextForLLM(context)
  const isLayoutIntent = detectLayoutIntent(context.userMessage)
  const forceRenderLayout = overrides?.forceRenderLayout === true || isLayoutIntent
  const forceRenderLayoutRetry = overrides?.forceRenderLayoutRetry === true
  return buildToolLoopInstructions({
    basePrompt: base,
    tenantId: context.tenantId,
    tenantPlan: context.tenantPlan,
    roleInProduct: context.roleInProduct,
    uiIntent: context.uiContract?.intent ?? 'informational_qna',
    requiresTool: context.uiContract?.requiresTool === true,
    allowedFallback: context.uiContract?.allowedFallback ?? 'none',
    ...(context.userPreferences.dashboardGoal
      ? { dashboardGoal: context.userPreferences.dashboardGoal }
      : {}),
    contextSummary,
    forceRenderLayout,
    forceRenderLayoutRetry,
  })
}

function buildInitialLayoutSystemInstructions(context: AgentContext): string {
  const base = buildSystemInstructions(context)
  const roleHint = buildInitialLayoutRoleHint(context.userRole)
  return `${base}\n\n${roleHint}\nEach card must have: moduleId (exact string from vocabulary), colSpan (3-12), rowSpan (1-3), order (0-based), visible true. Include a short descriptive title for each card.`
}

class NovaToolLoopAgent {
  async stream(
    input: AgentStreamInput,
  ): Promise<{ toUIMessageStreamResponse: () => Response }> {
    const options = callOptionsSchema.parse({
      userId: input.options.userId,
      userRole: input.options.userRole,
      tenantId: input.options.tenantId,
      tenantPlan: input.options.tenantPlan,
      productName: input.options.productName,
      productDomain: input.options.productDomain,
      productDescription: input.options.productDescription,
      roleInProduct: input.options.roleInProduct,
      criticalSignals: input.options.criticalSignals,
      dashboardGoal: input.options.userPreferences.dashboardGoal,
    })

    const model = await getActiveModel()
    const forceRenderLayout =
      input.forceRenderLayout === true || detectLayoutIntent(input.options.userMessage)
    const system = buildSystemInstructions(
      {
        ...input.options,
        userPreferences: options.dashboardGoal
          ? { ...input.options.userPreferences, dashboardGoal: options.dashboardGoal }
          : { ...input.options.userPreferences },
      },
      {
        forceRenderLayout,
        forceRenderLayoutRetry: input.forceRenderLayoutRetry === true,
      },
    )

    writeAgentLog({
      event: 'agent_turn_start',
      intent: input.options.uiContract?.intent ?? 'informational_qna',
      requiresTool: input.options.uiContract?.requiresTool === true,
      role: input.options.userRole,
      tenantId: input.options.tenantId,
      productDomain: input.options.productDomain,
    })

    if (input.messages != null && input.messages.length > 0) {
      return streamText({
        model,
        system,
        messages: input.messages,
        tools: genUiTools,
        stopWhen: stepCountIs(5),
      })
    }

    return streamText({
      model,
      system,
      prompt: input.prompt ?? '',
      tools: genUiTools,
      stopWhen: stepCountIs(5),
    })
  }

  /**
   * Runs a bounded tool loop to produce an initial layout (render_layout).
   * Used by POST /api/agent when composeInitialLayout is true.
   */
  async composeInitialLayout(
    context: AgentContext,
  ): Promise<{ cards: unknown[] } | null> {
    callOptionsSchema.parse({
      userId: context.userId,
      userRole: context.userRole,
      tenantId: context.tenantId,
      tenantPlan: context.tenantPlan,
      productName: context.productName,
      productDomain: context.productDomain,
      productDescription: context.productDescription,
      roleInProduct: context.roleInProduct,
      criticalSignals: context.criticalSignals,
      dashboardGoal: context.userPreferences.dashboardGoal,
    })

    const model = await getActiveModel()
    const system = buildInitialLayoutSystemInstructions(context)

    const result = await generateText({
      model,
      system,
      prompt: 'Compose the initial dashboard layout for this user.',
      tools: { render_layout: genUiTools.render_layout },
      toolChoice: 'required',
      stopWhen: stepCountIs(5),
    })

    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        if (tr.toolName !== 'render_layout') continue
        const output = tr.output
        if (typeof output !== 'object' || output === null || !('cards' in output))
          continue
        const cardsUnknown = (output as { cards: unknown }).cards
        if (!Array.isArray(cardsUnknown)) continue
        return { cards: cardsUnknown }
      }
    }

    return null
  }
}

export const novaAgent = new NovaToolLoopAgent()
