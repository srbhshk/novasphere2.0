import type { AgentContext } from './context.types'
import type { ProductConfig } from './product.types'
import type { UserRole } from './agent.types'

const PROMPT_IDS = {
  system: 'system',
  layout: 'layout',
  anomaly: 'anomaly',
  intent: 'intent',
} as const

export type PromptId = (typeof PROMPT_IDS)[keyof typeof PROMPT_IDS]

const INTENTS = {
  layoutChange: 'layout_change',
  question: 'question',
  anomalyQuery: 'anomaly_query',
  filterRequest: 'filter_request',
  clarificationNeeded: 'clarification_needed',
} as const

type Intent = (typeof INTENTS)[keyof typeof INTENTS]

const SYSTEM_PROMPT_HEADER = [
  'You are Nova, the controller of a domain-aware dashboard UI.',
  'You do not merely answer questions; you decide what the UI should show next.',
  'Be concise. Prefer structured output. Never invent data.',
].join('\n')

const ROLE_GUIDANCE: Record<UserRole, string> = {
  ceo: [
    'Audience: CEO.',
    'Use board-level language and outcomes.',
    'Prioritize top-line metrics, growth, churn, and major risks.',
  ].join('\n'),
  engineer: [
    'Audience: Engineer.',
    'Use technical language and operational reasoning.',
    'Prioritize reliability, latency, error budgets, and root-cause hypotheses.',
  ].join('\n'),
  admin: [
    'Audience: Admin.',
    'Prioritize configuration, access, platform health, and policy compliance.',
  ].join('\n'),
  viewer: [
    'Audience: Viewer (read-only).',
    'Summarize clearly. Avoid suggesting destructive actions.',
  ].join('\n'),
}

const PRODUCT_BLOCK = (product: ProductConfig): string => {
  const roleContextLines = [
    `admin: ${product.roleContext.admin}`,
    `ceo: ${product.roleContext.ceo}`,
    `engineer: ${product.roleContext.engineer}`,
    `viewer: ${product.roleContext.viewer}`,
  ].join('\n')

  const terminology = Object.entries(product.terminology)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  return [
    'Product context:',
    `name: ${product.name}`,
    `domain: ${product.domain}`,
    `description: ${product.description}`,
    `primaryMetrics: ${product.primaryMetrics.join(', ')}`,
    `criticalSignals: ${product.criticalSignals.join(', ')}`,
    'terminology:',
    terminology.length > 0 ? terminology : '- (none)',
    'roleContext:',
    roleContextLines,
  ].join('\n')
}

export function getSystemPrompt(role: UserRole, product: ProductConfig): string {
  return [SYSTEM_PROMPT_HEADER, ROLE_GUIDANCE[role], PRODUCT_BLOCK(product)].join('\n\n')
}

export function getLayoutPrompt(context: AgentContext): string {
  const visibleModules = context.visibleCards
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .map(
      (c) =>
        `- ${c.moduleId} (${c.colSpan}x${c.rowSpan})${c.title ? `: ${c.title}` : ''}`,
    )
    .join('\n')

  const goals = [
    'Compose a dashboard layout using the available module vocabulary.',
    'If the user goal is ambiguous, ask one clarifying question.',
    'Prefer fewer, higher-signal modules.',
  ].join('\n')

  return [
    goals,
    'Current route:',
    context.currentRoute,
    'Visible cards:',
    visibleModules.length > 0 ? visibleModules : '- (none)',
    'User message:',
    context.userMessage,
  ].join('\n')
}

export function getAnomalyPrompt(signals: string[], product: ProductConfig): string {
  const signalList = signals.map((s) => `- ${s}`).join('\n')
  const criticalSignals = product.criticalSignals.map((s) => `- ${s}`).join('\n')

  return [
    'Explain an anomaly using cross-signal reasoning.',
    'Use product terminology where applicable.',
    'Include a hypothesis and confidence level.',
    'Signals:',
    signalList.length > 0 ? signalList : '- (none)',
    'Product critical signals:',
    criticalSignals.length > 0 ? criticalSignals : '- (none)',
  ].join('\n')
}

export function getIntentPrompt(message: string): string {
  const intentList: Intent[] = [
    INTENTS.layoutChange,
    INTENTS.question,
    INTENTS.anomalyQuery,
    INTENTS.filterRequest,
    INTENTS.clarificationNeeded,
  ]

  return [
    'Classify the user intent into exactly one of:',
    intentList.map((i) => `- ${i}`).join('\n'),
    'Return only the intent string.',
    'User message:',
    message,
  ].join('\n')
}

type PromptBuilders = {
  system: (args: { role: UserRole; product: ProductConfig }) => string
  layout: (args: { context: AgentContext }) => string
  anomaly: (args: { signals: string[]; product: ProductConfig }) => string
  intent: (args: { message: string }) => string
}

export const PROMPTS: PromptBuilders = {
  system: ({ role, product }) => getSystemPrompt(role, product),
  layout: ({ context }) => getLayoutPrompt(context),
  anomaly: ({ signals, product }) => getAnomalyPrompt(signals, product),
  intent: ({ message }) => getIntentPrompt(message),
}
