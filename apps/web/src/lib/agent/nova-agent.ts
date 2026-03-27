import type { ModelMessage } from 'ai'
import { generateText, stepCountIs, streamText } from 'ai'
import type { AgentContext, ProductConfig, UserRole } from '@novasphere/agent-core'
import { getSystemPrompt } from '@novasphere/agent-core'
import { z } from 'zod'
import { getActiveModel } from './models'
import { genUiTools } from './genui/tools'
import { writeAgentLog } from './observability'
import { novaConfig } from '../../../../../nova.config'

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
  const strongLayoutOnlyInstruction = forceRenderLayout
    ? [
        'LAYOUT INTENT DETECTED:',
        'You MUST call render_layout at least once in your response.',
        'You may include explanation text, reasoning, and other tool calls alongside render_layout.',
        'DO NOT return layout JSON as raw text — always use the render_layout tool.',
        'Do NOT skip the render_layout call.',
        forceRenderLayoutRetry
          ? 'You did not call render_layout on the previous attempt. You MUST call it now before responding.'
          : '',
      ]
        .filter((line) => line.length > 0)
        .join('\n')
    : ''
  const toolInstructions = [
    'You are the novasphere ToolLoopAgent. Use tools to compose the dashboard.',
    'Policy contract: use contract metadata from this request to decide whether a tool call is mandatory.',
    'If uiContract.requiresTool is true and intent is layout_change or visibility_change, call render_layout or filter_by_relevance before final text.',
    'If uiContract.requiresTool is true and intent is anomaly_explanation, call explain_anomaly before final text.',
    'Never ask the user questions. If intent is clarification_required, make the best assumption and proceed as informational_qna.',
    'If there is no meaningful structural change, you may narrate a no-op recommendation while preserving current layout.',
    strongLayoutOnlyInstruction,
    `Tenant: ${context.tenantId} (${context.tenantPlan})`,
    `Role context: ${context.roleInProduct}`,
    `UI contract intent: ${context.uiContract?.intent ?? 'informational_qna'}`,
    `UI contract requiresTool: ${context.uiContract?.requiresTool === true ? 'true' : 'false'}`,
    `UI contract allowedFallback: ${context.uiContract?.allowedFallback ?? 'none'}`,
    context.userPreferences.dashboardGoal
      ? `Dashboard goal: ${context.userPreferences.dashboardGoal}`
      : '',
    contextSummary,
  ]

  return [...[base], toolInstructions.filter((line) => line.length > 0)].join('\n\n')
}

function buildInitialLayoutSystemInstructions(context: AgentContext): string {
  const base = buildSystemInstructions(context)
  const role = context.userRole
  const roleHint =
    role === 'ceo'
      ? [
          'For this request you MUST call render_layout exactly once.',
          'Compose a CEO executive layout with these module IDs in this order:',
          '  Row 1 (colSpan 4 each, rowSpan 1): metric-mrr, metric-arr, metric-nrr',
          '  Row 2 (colSpan 3 each, rowSpan 1): metric-churn, metric-arpu, metric-ltv, metric-conversion',
          '  Row 3 (colSpan 8+4, rowSpan 2): chart-revenue-comparison, chart-pipeline',
          '  Row 4 (colSpan 6+6, rowSpan 2): chart-top-customers, customer-table',
        ].join('\n')
      : role === 'engineer'
        ? [
            'For this request you MUST call render_layout exactly once.',
            'Compose an Engineer operational layout with these module IDs:',
            '  Row 1 (colSpan 3 each, rowSpan 1): metric-api-latency, metric-error-rate, metric-uptime, metric-request-volume',
            '  Row 2 (colSpan 8+4, rowSpan 2): chart-response-time, chart-error-breakdown',
            '  Row 3 (colSpan 6+6, rowSpan 2): deployment-log, system-alerts',
          ].join('\n')
        : role === 'admin'
          ? [
              'For this request you MUST call render_layout exactly once.',
              'Compose an Admin platform layout with these module IDs:',
              '  Row 1 (colSpan 4 each, rowSpan 1): metric-users, metric-new-signups, metric-active-orgs',
              '  Row 2 (colSpan 4+8, rowSpan 2): chart-plan-distribution, chart-user-growth',
              '  Row 3 (colSpan 6+6, rowSpan 2): activity-feed, pipeline-table',
            ].join('\n')
          : [
              'For this request you MUST call render_layout exactly once.',
              'Compose a Viewer concise layout: metric-mrr (colSpan 6), metric-users (colSpan 6), chart-revenue (colSpan 8 rowSpan 2), chart-pipeline (colSpan 4 rowSpan 2), activity-feed (colSpan 12 rowSpan 2).',
            ].join('\n')
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
