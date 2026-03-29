import type { AgentContext } from './context.types'
import type { ProductConfig } from './product.types'
import type { UserRole } from './agent.types'
import { UI_CONTRACT_FALLBACK, UI_INTENT } from './agent.types'

export type PromptId = 'system' | 'layout' | 'anomaly' | 'intent'

const UI_INTENT_HINTS = {
  layout_change: [
    'show',
    'surface',
    'focus',
    'prioritize',
    'reorder',
    'arrange',
    'dashboard',
  ],
  visibility_change: ['hide', 'only', 'filter', 'remove', 'pin', 'unpin'],
  anomaly_explanation: ['anomaly', 'why', 'explain', 'root cause', 'investigate'],
  informational_qna: ['what', 'how', 'status', 'summary', 'compare'],
} as const

const STRICT_TOOL_USAGE_CONTRACT = [
  'STRICT TOOL USAGE CONTRACT:',
  '- You MUST match each tool schema EXACTLY. Incorrect field names will break the system.',
  '- Module IDs must be chosen ONLY from the provided list of valid moduleIds.',
  '- If the request requires any layout change, you MUST call render_layout.',
  '- If you fail to call tools correctly, UI will not update.',
  '',
  'Exact JSON examples:',
  '',
  'render_layout',
  '{',
  '  "cards": [',
  '    {',
  '      "moduleId": "metric-mrr",',
  '      "colSpan": 4,',
  '      "rowSpan": 1,',
  '      "title": "MRR",',
  '      "order": 0,',
  '      "visible": true',
  '    },',
  '    {',
  '      "moduleId": "chart-revenue",',
  '      "colSpan": 8,',
  '      "rowSpan": 2,',
  '      "title": "Revenue",',
  '      "order": 1,',
  '      "visible": true',
  '    }',
  '  ],',
  '  "reasoning": "Focusing the dashboard on revenue performance",',
  '  "layoutMode": "refine"',
  '}',
  '',
  'render_component',
  '{',
  '  "moduleId": "chart-revenue",',
  '  "colSpan": 8,',
  '  "rowSpan": 2,',
  '  "order": 1,',
  '  "config": {',
  '    "timeRange": "90d"',
  '  }',
  '}',
  '',
  'filter_by_relevance',
  '{',
  '  "visibleModuleIds": ["metric-mrr", "chart-revenue"],',
  '  "hiddenModuleIds": ["deployment-log"],',
  '  "narrative": "Focusing on revenue metrics"',
  '}',
  '',
  'explain_anomaly',
  '{',
  '  "signals": ["churn_rate"],',
  '  "hypothesis": "SMB segment churn increased",',
  '  "confidence": "medium"',
  '}',
].join('\n')

const SYSTEM_PROMPT_HEADER = [
  'You are Nova, the controller of a domain-aware dashboard UI.',
  'You are a decision engine, not a layout generator.',
  'You do not merely answer questions; you decide what the UI should show next.',
  'Never invent data. Use only provided signals, context, and module vocabulary.',
  '',
  'CRITICAL RULE — LAYOUT INTENT:',
  'If user intent is layout-related (e.g. show, focus, optimize, improve dashboard, what matters), you MUST call render_layout at least once.',
  'You may include explanation text, reasoning, and other tool calls alongside render_layout.',
  'You are NOT allowed to:',
  '* skip render_layout entirely when the intent is layout-related',
  '* return layout JSON as raw text — always use the render_layout tool',
  '* ask clarification instead of acting',
  'Failure to call render_layout when layout is the intent = system failure.',
  '',
  'Operating contract (strict):',
  '1) Reasoning Before Rendering',
  'You MUST:',
  '- analyze data signals',
  '- determine user intent',
  '- decide what matters',
  '- THEN call render_layout',
  '',
  '2) Data-Driven UI Rules',
  '- If an anomaly exists, you MUST include anomaly-banner.',
  '- If churn is high or rising, prioritize metric-churn and chart-pipeline.',
  '- If the user focus is revenue/growth, prioritize metric-mrr and chart-revenue.',
  '- If userRole is engineer, prioritize system health modules: metric-api-latency, metric-error-rate, metric-uptime, deployment-log.',
  '',
  '3) Stability Rules',
  '- Do NOT remove critical modules unless strictly necessary to satisfy user intent.',
  '- Prefer updating the existing layout over replacing the entire layout.',
  '- For render_layout, default layoutMode to "refine". Use "replace" only when the user explicitly asks for a new layout or there is a major context shift.',
  '- Maintain the user mental model: preserve familiar anchors and only change what is needed.',
  '- Preserve important modules whenever possible (especially anomaly-banner and role-critical health/business modules).',
  '',
  '4) Context Awareness (always evaluate explicitly)',
  '- activeMetrics',
  '- recentActivity',
  '- criticalInsights',
  '- userRole',
  '- productDomain',
  '',
  '5) Tool Usage Rules',
  '- Use render_layout only when a structural layout change is necessary, and include layoutMode: "refine" | "replace".',
  '- Any layout change MUST use render_layout.',
  '- Use filter_by_relevance for minor scope/visibility adjustments.',
  '- Use explain_anomaly only with the exact fields: signals, hypothesis, confidence.',
  '- Use filter_by_relevance only with the exact fields: visibleModuleIds, hiddenModuleIds, narrative.',
  '- Never ask the user questions. When intent is unclear, make the best assumption and act.',
  '',
  '6) Output Discipline',
  '- Always perform internal reasoning before tool calls.',
  '- Keep user-facing explanations short and decision-focused.',
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
    STRICT_TOOL_USAGE_CONTRACT,
    ROLE_GUIDANCE[role],
    PRODUCT_BLOCK(product),
    MODULE_VOCABULARY,
  ].join('\n\n')
}

type ToolLoopInstructionArgs = {
  basePrompt: string
  tenantId: string
  tenantPlan: AgentContext['tenantPlan']
  roleInProduct: string
  uiIntent: string
  requiresTool: boolean
  allowedFallback: string
  dashboardGoal?: string
  contextSummary: string
  forceRenderLayout: boolean
  forceRenderLayoutRetry: boolean
}

export function buildToolLoopInstructions(args: ToolLoopInstructionArgs): string {
  const strongLayoutOnlyInstruction = args.forceRenderLayout
    ? [
        'LAYOUT INTENT DETECTED:',
        'You MUST call render_layout at least once in your response.',
        'You may include explanation text, reasoning, and other tool calls alongside render_layout.',
        'DO NOT return layout JSON as raw text — always use the render_layout tool.',
        'Do NOT skip the render_layout call.',
        args.forceRenderLayoutRetry
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
    `Tenant: ${args.tenantId} (${args.tenantPlan})`,
    `Role context: ${args.roleInProduct}`,
    `UI contract intent: ${args.uiIntent}`,
    `UI contract requiresTool: ${args.requiresTool ? 'true' : 'false'}`,
    `UI contract allowedFallback: ${args.allowedFallback}`,
    args.dashboardGoal ? `Dashboard goal: ${args.dashboardGoal}` : '',
    args.contextSummary,
  ]

  return [...[args.basePrompt], toolInstructions.filter((line) => line.length > 0)].join(
    '\n\n',
  )
}

export function buildInitialLayoutRoleHint(role: UserRole): string {
  if (role === 'ceo') {
    return [
      'For this request you MUST call render_layout exactly once.',
      'Compose a CEO executive layout with these module IDs in this order:',
      '  Row 1 (colSpan 4 each, rowSpan 1): metric-mrr, metric-arr, metric-nrr',
      '  Row 2 (colSpan 3 each, rowSpan 1): metric-churn, metric-arpu, metric-ltv, metric-conversion',
      '  Row 3 (colSpan 8+4, rowSpan 2): chart-revenue-comparison, chart-pipeline',
      '  Row 4 (colSpan 6+6, rowSpan 2): chart-top-customers, customer-table',
    ].join('\n')
  }

  if (role === 'engineer') {
    return [
      'For this request you MUST call render_layout exactly once.',
      'Compose an Engineer operational layout with these module IDs:',
      '  Row 1 (colSpan 3 each, rowSpan 1): metric-api-latency, metric-error-rate, metric-uptime, metric-request-volume',
      '  Row 2 (colSpan 8+4, rowSpan 2): chart-response-time, chart-error-breakdown',
      '  Row 3 (colSpan 6+6, rowSpan 2): deployment-log, system-alerts',
    ].join('\n')
  }

  if (role === 'admin') {
    return [
      'For this request you MUST call render_layout exactly once.',
      'Compose an Admin platform layout with these module IDs:',
      '  Row 1 (colSpan 4 each, rowSpan 1): metric-users, metric-new-signups, metric-active-orgs',
      '  Row 2 (colSpan 4+8, rowSpan 2): chart-plan-distribution, chart-user-growth',
      '  Row 3 (colSpan 6+6, rowSpan 2): activity-feed, pipeline-table',
    ].join('\n')
  }

  return [
    'For this request you MUST call render_layout exactly once.',
    'Compose a Viewer concise layout: metric-mrr (colSpan 6), metric-users (colSpan 6), chart-revenue (colSpan 8 rowSpan 2), chart-pipeline (colSpan 4 rowSpan 2), activity-feed (colSpan 12 rowSpan 2).',
  ].join('\n')
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
    'If the user goal is ambiguous, make the best assumption and act.',
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
  const intentList = [
    UI_INTENT.layoutChange,
    UI_INTENT.visibilityChange,
    UI_INTENT.anomalyExplanation,
    UI_INTENT.informationalQna,
  ]

  return [
    'Classify the user intent into exactly one of:',
    intentList.map((i) => `- ${i}`).join('\n'),
    'Return only the intent string.',
    'User message:',
    message,
  ].join('\n')
}

export function classifyUiIntent(
  message: string,
): (typeof UI_INTENT)[keyof typeof UI_INTENT] {
  const normalized = message.trim().toLowerCase()
  if (normalized.length === 0) {
    return UI_INTENT.informationalQna
  }

  const hasAnomaly = UI_INTENT_HINTS.anomaly_explanation.some((hint) =>
    normalized.includes(hint),
  )
  if (hasAnomaly) {
    return UI_INTENT.anomalyExplanation
  }

  const hasLayoutSignal = UI_INTENT_HINTS.layout_change.some((hint) =>
    normalized.includes(hint),
  )
  if (hasLayoutSignal) {
    return UI_INTENT.layoutChange
  }

  const hasVisibilitySignal = UI_INTENT_HINTS.visibility_change.some((hint) =>
    normalized.includes(hint),
  )
  if (hasVisibilitySignal) {
    return UI_INTENT.visibilityChange
  }

  const hasQuestion = normalized.endsWith('?')
  const hasInfoSignal = UI_INTENT_HINTS.informational_qna.some((hint) =>
    normalized.includes(hint),
  )
  if (hasQuestion || hasInfoSignal) {
    return UI_INTENT.informationalQna
  }

  return UI_INTENT.informationalQna
}

export function requiresToolForIntent(
  intent: (typeof UI_INTENT)[keyof typeof UI_INTENT],
): boolean {
  return (
    intent === UI_INTENT.layoutChange ||
    intent === UI_INTENT.visibilityChange ||
    intent === UI_INTENT.anomalyExplanation
  )
}

export function allowedFallbackForIntent(
  _intent: (typeof UI_INTENT)[keyof typeof UI_INTENT],
): (typeof UI_CONTRACT_FALLBACK)[keyof typeof UI_CONTRACT_FALLBACK] {
  return UI_CONTRACT_FALLBACK.none
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
