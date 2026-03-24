import type { ModelMessage } from 'ai'
import { generateText, stepCountIs, streamText } from 'ai'
import type { AgentContext, UserRole, ProductConfig } from '@novasphere/agent-core'
import { getSystemPrompt } from '@novasphere/agent-core'
import { z } from 'zod'
import { getActiveModel } from './models'
import { genUiTools } from './genui/tools'
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
  | { prompt: string; messages?: never; options: AgentContext }
  | { prompt?: never; messages: ModelMessage[]; options: AgentContext }

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

function buildSystemInstructions(context: AgentContext): string {
  const product = toProductConfig(context)
  const role = toUserRole(context.userRole)

  const base = getSystemPrompt(role, product)
  const toolInstructions = [
    'You are the novasphere ToolLoopAgent. Use tools to compose the dashboard.',
    'For concrete layout requests (examples: "show me what matters", "board meeting", "rearrange dashboard"), you MUST call render_layout exactly once before your final text response.',
    'For anomaly explanations (examples: "Explain this anomaly: ..."), you MUST call explain_anomaly before any final text response.',
    'Do not call render_layout for anomaly explanation requests.',
    'For ambiguous requests that require one clarifying question, you MUST call ask_clarification and then respond with only the clarifying question text. Do not call render_layout until the user answers.',
    'Do not ask clarifying questions when the request is specific enough to compose a layout directly.',
    `Tenant: ${context.tenantId} (${context.tenantPlan})`,
    `Role context: ${context.roleInProduct}`,
    context.userPreferences.dashboardGoal
      ? `Dashboard goal: ${context.userPreferences.dashboardGoal}`
      : '',
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
  async stream(input: AgentStreamInput): Promise<ReturnType<typeof streamText>> {
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
    const system = buildSystemInstructions({
      ...input.options,
      userPreferences: options.dashboardGoal
        ? { ...input.options.userPreferences, dashboardGoal: options.dashboardGoal }
        : { ...input.options.userPreferences },
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
      tools: genUiTools,
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
