import type { AgentContext } from './context.types'
import type { ProductConfig } from './product.types'
import type { UserRole } from './agent.types'

export type PromptId = 'system' | 'layout' | 'anomaly' | 'intent'

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

// Full vocabulary available in the dashboard MODULE_REGISTRY.
// Keep this in sync with apps/web/src/app/(dashboard)/[tenant]/dashboard/modules/registry.ts
const MODULE_VOCABULARY = `
Available moduleIds (use exact strings):
  KPI – revenue/business (CEO, Admin, Viewer):
    metric-mrr        MRR ($847.5K, +12.3%)
    metric-arr        ARR ($10.2M)
    metric-nrr        Net Revenue Retention (112%)
    metric-churn      Churn Rate (7.8% – ANOMALY)
    metric-arpu       Average Revenue Per User ($66)
    metric-ltv        Customer LTV ($2,400)
    metric-conversion Trial-to-paid conversion (24%)
    metric-users      Total / Active Users (12,847)

  KPI – platform/admin (Admin):
    metric-new-signups  New Signups / Week (342)
    metric-active-orgs  Active Organisations (1,847)

  KPI – infrastructure (Engineer):
    metric-api-latency    API Latency p50/p99 (82ms / 248ms – p99 ANOMALY)
    metric-error-rate     Error Rate (0.12%)
    metric-uptime         Uptime (99.97%)
    metric-request-volume Requests per day (2.4M)

  Charts – revenue/business:
    chart-revenue             MRR area chart (6 months)
    chart-revenue-comparison  MRR vs prior year area chart (12 months)
    chart-churn-trend         Churn rate sparkline (12 months)
    chart-user-growth         User growth vs prior year (12 months)
    chart-top-customers       Top 10 customers by MRR (horizontal bar)
    chart-pipeline            Pipeline by stage donut

  Charts – admin/platform:
    chart-plan-distribution  Free/Pro/Enterprise breakdown donut
    chart-feature-adoption   Feature adoption horizontal bar

  Charts – infrastructure:
    chart-response-time   24h p50/p99 latency area chart
    chart-error-breakdown Errors by endpoint horizontal bar
    chart-activity        Weekly activity heatmap
    chart-sparkline       Generic sparkline

  Tables:
    customer-table   Top customers (name, plan, MRR, churn risk, last active) — CEO/Admin
    pipeline-table   Active deals (company, value, stage, owner, win %, close date) — CEO/Admin

  Feeds:
    activity-feed    Business/platform activity events (all roles)
    deployment-log   Recent deployments with status (Engineer/Admin)
    system-alerts    Active system alerts/incidents (Engineer/Admin)

  AI:
    anomaly-banner   Agent-populated anomaly explanation card

Grid rules: colSpan must be one of: 3 4 5 6 7 8 9 10 11 12. rowSpan: 1 2 3.
Prefer rows that sum to 12. KPI cards: colSpan 3 or 4, rowSpan 1.
Charts: colSpan 4–8, rowSpan 2. Tables/Feeds: colSpan 6–12, rowSpan 2–3.
`.trim()

const ROLE_GUIDANCE: Record<UserRole, string> = {
  ceo: [
    'Audience: CEO.',
    'Use board-level language and outcomes.',
    'Prioritize top-line metrics, growth, churn, and major risks.',
    'Prefer: metric-mrr, metric-arr, metric-nrr, metric-churn, chart-revenue-comparison, chart-pipeline, customer-table.',
  ].join('\n'),
  engineer: [
    'Audience: Engineer.',
    'Use technical language and operational reasoning.',
    'Prioritize reliability, latency, error budgets, and root-cause hypotheses.',
    'Prefer: metric-api-latency, metric-error-rate, metric-uptime, metric-request-volume, chart-response-time, chart-error-breakdown, deployment-log, system-alerts.',
  ].join('\n'),
  admin: [
    'Audience: Admin.',
    'Prioritize configuration, access, platform health, and policy compliance.',
    'Prefer: metric-users, metric-new-signups, metric-active-orgs, metric-mrr, chart-plan-distribution, chart-user-growth, activity-feed, pipeline-table.',
  ].join('\n'),
  viewer: [
    'Audience: Viewer (read-only).',
    'Summarize clearly. Avoid suggesting destructive actions.',
    'Prefer: metric-mrr, metric-users, chart-revenue, chart-pipeline, activity-feed.',
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
  return [
    SYSTEM_PROMPT_HEADER,
    ROLE_GUIDANCE[role],
    PRODUCT_BLOCK(product),
    MODULE_VOCABULARY,
  ].join('\n\n')
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
