import type { BentoCardConfig, SuggestionChip } from '@novasphere/agent-core'
import type { ZodError, ZodIssue } from 'zod'
import { writeAgentLog } from '@/lib/agent/observability'
import type { GenUiToolName } from './tools'
import { toolInputSchemas } from './tools'

type LayoutStoreLike = {
  setLayout: (layout: BentoCardConfig[]) => void
  getLayout: () => BentoCardConfig[] | null
}

type AgentStoreLike = {
  setSuggestions: (chips: SuggestionChip[]) => void
}

type ToolStores = {
  layoutStore: LayoutStoreLike
  agentStore: AgentStoreLike
}

type LayoutMode = 'replace' | 'refine'

type ToolValidationFailure = {
  status: 'validation_failed'
  feedback: string
  issues: string[]
}

type ToolExecutionFailure = {
  status: 'execution_failed'
  error: string
}

type ToolExecutionSuccess = {
  status: 'applied'
}

export type ToolExecutionResult =
  | ToolValidationFailure
  | ToolExecutionFailure
  | ToolExecutionSuccess

const IMPORTANT_MODULE_IDS = new Set<string>([
  'anomaly-banner',
  'metric-mrr',
  'metric-churn',
  'metric-api-latency',
  'system-alerts',
  'deployment-log',
])

const TOOL_SCHEMA_BY_NAME: Record<
  GenUiToolName,
  (typeof toolInputSchemas)[GenUiToolName]
> = {
  render_layout: toolInputSchemas.render_layout,
  render_component: toolInputSchemas.render_component,
  ask_clarification: toolInputSchemas.ask_clarification,
  explain_anomaly: toolInputSchemas.explain_anomaly,
  filter_by_relevance: toolInputSchemas.filter_by_relevance,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getValueAtPath(input: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  let current = input
  for (const segment of path) {
    if (typeof segment === 'symbol') {
      return undefined
    }
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        return undefined
      }
      current = current[segment]
      continue
    }

    if (!isRecord(current)) {
      return undefined
    }
    current = current[segment]
  }

  return current
}

function isMissingFieldIssue(issue: ZodIssue): boolean {
  return issue.path.length > 0 && issue.message.includes('received undefined')
}

function isModuleIdPath(path: ReadonlyArray<PropertyKey>): boolean {
  const [firstSegment] = path
  return (
    firstSegment === 'moduleId' ||
    firstSegment === 'visibleModuleIds' ||
    firstSegment === 'hiddenModuleIds' ||
    firstSegment === 'cards'
  )
}

function formatFieldPath(path: ReadonlyArray<PropertyKey>): string {
  return path
    .map((segment) => {
      if (typeof segment === 'number') {
        return `[${segment}]`
      }
      if (typeof segment === 'symbol') {
        return segment.description ?? 'Symbol'
      }
      return segment
    })
    .join('.')
    .replace('.[', '[')
}

function formatValidationIssues(input: unknown, error: ZodError): string[] {
  return error.issues.map((issue) => {
    if (isMissingFieldIssue(issue)) {
      return `Missing field: ${formatFieldPath(issue.path)}`
    }

    if (isModuleIdPath(issue.path)) {
      const invalidModuleId = getValueAtPath(input, issue.path)
      return `Invalid moduleId: ${String(invalidModuleId)}`
    }

    if (issue.code === 'unrecognized_keys') {
      return `Unexpected fields: ${issue.keys.join(', ')}`
    }

    const fieldPath = issue.path.length > 0 ? formatFieldPath(issue.path) : 'input'
    return `Invalid field ${fieldPath}: ${issue.message}`
  })
}

function buildToolValidationFailure(
  toolName: GenUiToolName,
  input: Record<string, unknown>,
  error: ZodError,
): ToolValidationFailure {
  const issues = formatValidationIssues(input, error)
  return {
    status: 'validation_failed',
    issues,
    feedback: [
      'Tool call failed:',
      '',
      `Tool: ${toolName}`,
      ...issues.map((issue) => `- ${issue}`),
    ].join('\n'),
  }
}

function validateToolArgs(
  toolName: GenUiToolName,
  input: Record<string, unknown>,
):
  | { success: true; args: Record<string, unknown> }
  | { success: false; failure: ToolValidationFailure } {
  const schema = TOOL_SCHEMA_BY_NAME[toolName]
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      failure: buildToolValidationFailure(toolName, input, parsed.error),
    }
  }

  return {
    success: true,
    // Safety: parsed.data passed the tool-specific Zod schema; values are plain object fields.
    args: parsed.data as Record<string, unknown>,
  }
}

function toBentoCardConfig(value: unknown): BentoCardConfig | null {
  if (!isRecord(value)) {
    return null
  }

  const moduleId = value['moduleId']
  const colSpan = value['colSpan']
  const rowSpan = value['rowSpan']
  const visible = value['visible']
  const order = value['order']

  if (
    typeof moduleId !== 'string' ||
    typeof colSpan !== 'number' ||
    typeof rowSpan !== 'number' ||
    typeof visible !== 'boolean' ||
    typeof order !== 'number'
  ) {
    return null
  }

  const id = typeof value['id'] === 'string' ? value['id'] : `${moduleId}-${order}`
  const title = typeof value['title'] === 'string' ? value['title'] : undefined
  const config = isRecord(value['config']) ? value['config'] : undefined

  return {
    id,
    moduleId,
    // Safety: Zod already constrained these numeric ranges in the tool schema.
    colSpan: colSpan as BentoCardConfig['colSpan'],
    // Safety: Zod already constrained these numeric ranges in the tool schema.
    rowSpan: rowSpan as BentoCardConfig['rowSpan'],
    visible,
    order,
    ...(title !== undefined ? { title } : {}),
    ...(config !== undefined ? { config } : {}),
  }
}

function normalizeLayoutOrder(layout: BentoCardConfig[]): BentoCardConfig[] {
  return layout.map((card, index) => ({
    ...card,
    order: index,
  }))
}

function dedupeByModuleId(layout: BentoCardConfig[]): BentoCardConfig[] {
  const seen = new Set<string>()
  const dedupedReversed: BentoCardConfig[] = []
  for (let i = layout.length - 1; i >= 0; i -= 1) {
    const card = layout[i]
    if (!card) continue
    if (seen.has(card.moduleId)) continue
    seen.add(card.moduleId)
    dedupedReversed.push(card)
  }
  return dedupedReversed.reverse()
}

function packVisibleCards(layout: BentoCardConfig[]): BentoCardConfig[] {
  const orderedVisible = [...layout]
    .filter((card) => card.visible)
    .sort((a, b) => a.order - b.order)
  const hidden = [...layout]
    .filter((card) => !card.visible)
    .sort((a, b) => a.order - b.order)

  const pending = [...orderedVisible]
  const packed: BentoCardConfig[] = []
  let remainingInRow = 12

  while (pending.length > 0) {
    let selectedIndex = pending.findIndex((card) => card.colSpan <= remainingInRow)
    if (selectedIndex === -1) {
      remainingInRow = 12
      selectedIndex = pending.findIndex((card) => card.colSpan <= remainingInRow)
      if (selectedIndex === -1) {
        selectedIndex = 0
      }
    }

    const selected = pending.splice(selectedIndex, 1)[0]
    if (!selected) continue
    packed.push(selected)
    remainingInRow -= selected.colSpan
    if (remainingInRow <= 0) {
      remainingInRow = 12
    }
  }

  return normalizeLayoutOrder([...packed, ...hidden])
}

function sanitizeLayout(layout: BentoCardConfig[]): BentoCardConfig[] {
  return packVisibleCards(dedupeByModuleId(layout))
}

function toLayoutMode(args: Record<string, unknown>): LayoutMode {
  const rawMode = args['layoutMode']
  if (rawMode === 'replace' || rawMode === 'refine') {
    return rawMode
  }

  const reasoning =
    typeof args['reasoning'] === 'string' ? args['reasoning'].toLowerCase() : ''
  const replaceSignals = [
    'layoutmode:replace',
    'new layout',
    'completely new',
    'from scratch',
    'full reset',
    'major context shift',
    'switch role',
  ]
  const shouldReplace = replaceSignals.some((signal) => reasoning.includes(signal))
  return shouldReplace ? 'replace' : 'refine'
}

function mergeLayoutRefine(
  current: BentoCardConfig[],
  incoming: BentoCardConfig[],
): BentoCardConfig[] {
  const currentByModuleId = new Map(current.map((card) => [card.moduleId, card]))
  const incomingByModuleId = new Map(incoming.map((card) => [card.moduleId, card]))

  const refined: BentoCardConfig[] = incoming.map((card) => {
    const existing = currentByModuleId.get(card.moduleId)
    if (existing == null) {
      return card
    }
    const nextTitle = card.title ?? existing.title
    const nextConfig = card.config ?? existing.config
    return {
      ...existing,
      ...card,
      id: existing.id,
      ...(nextTitle !== undefined ? { title: nextTitle } : {}),
      ...(nextConfig !== undefined ? { config: nextConfig } : {}),
    }
  })

  const untouchedExisting = current.filter(
    (card) => !incomingByModuleId.has(card.moduleId),
  )
  const importantUntouched = untouchedExisting.filter((card) =>
    IMPORTANT_MODULE_IDS.has(card.moduleId),
  )
  const nonImportantUntouched = untouchedExisting.filter(
    (card) => !IMPORTANT_MODULE_IDS.has(card.moduleId),
  )

  return normalizeLayoutOrder([
    ...refined,
    ...importantUntouched,
    ...nonImportantUntouched,
  ])
}

function patchCard(
  layout: BentoCardConfig[],
  payload: Record<string, unknown>,
): BentoCardConfig[] {
  const moduleId = payload['moduleId']
  if (typeof moduleId !== 'string') {
    return layout
  }

  const next = [...layout]
  const index = next.findIndex((card) => card.moduleId === moduleId)
  if (index === -1) {
    return layout
  }

  const card = next[index]
  if (!card) {
    return layout
  }

  const nextConfig = isRecord(payload['config']) ? payload['config'] : card.config

  next[index] = {
    ...card,
    colSpan: typeof payload['colSpan'] === 'number' ? payload['colSpan'] : card.colSpan,
    rowSpan: typeof payload['rowSpan'] === 'number' ? payload['rowSpan'] : card.rowSpan,
    order: typeof payload['order'] === 'number' ? payload['order'] : card.order,
  }
  if (nextConfig) {
    next[index].config = nextConfig
  }

  return next
}

export function executeToolCall(
  toolName: GenUiToolName,
  args: Record<string, unknown>,
  stores: ToolStores,
): ToolExecutionResult {
  const validation = validateToolArgs(toolName, args)
  if (!validation.success) {
    return validation.failure
  }

  const safeArgs = validation.args

  try {
    if (toolName === 'render_layout') {
      const cards = safeArgs['cards']
      if (!Array.isArray(cards)) {
        throw new Error('render_layout requires a cards array.')
      }

      const parsed = cards.map((card) => {
        const nextCard = toBentoCardConfig(card)
        if (nextCard == null) {
          throw new Error('render_layout produced an invalid card payload.')
        }
        return nextCard
      })
      const mode = toLayoutMode(safeArgs)
      const current = stores.layoutStore.getLayout() ?? []
      const nextLayout =
        mode === 'replace' || current.length === 0
          ? parsed
          : mergeLayoutRefine(current, parsed)
      stores.layoutStore.setLayout(sanitizeLayout(nextLayout))
      return { status: 'applied' }
    }

    if (toolName === 'render_component') {
      const current = stores.layoutStore.getLayout() ?? []
      stores.layoutStore.setLayout(sanitizeLayout(patchCard(current, safeArgs)))
      return { status: 'applied' }
    }

    if (toolName === 'ask_clarification') {
      const question = safeArgs['question']
      const options = safeArgs['options']
      if (typeof question !== 'string' || !Array.isArray(options)) {
        throw new Error('ask_clarification requires a question and options array.')
      }

      const chips = options
        .filter(
          (option): option is string => typeof option === 'string' && option.length > 0,
        )
        .map((option, index) => ({
          id: `clarify-${index + 1}`,
          label: option,
          action: `${question} ${option}`,
        }))

      stores.agentStore.setSuggestions(chips)
      return { status: 'applied' }
    }

    if (toolName === 'explain_anomaly') {
      const signals = safeArgs['signals']
      const hypothesis = safeArgs['hypothesis']
      const confidence = safeArgs['confidence']
      if (
        !Array.isArray(signals) ||
        typeof hypothesis !== 'string' ||
        (confidence !== 'high' && confidence !== 'medium' && confidence !== 'low')
      ) {
        throw new Error('explain_anomaly received invalid validated input.')
      }

      const current = stores.layoutStore.getLayout() ?? []
      const anomalyConfig: Record<string, unknown> = {
        signals,
        hypothesis,
        confidence,
      }

      const next = [...current]
      const index = next.findIndex((card) => card.moduleId === 'anomaly-banner')
      if (index === -1) {
        const maxOrder = next.reduce((max, card) => Math.max(max, card.order), -1)
        next.push({
          id: 'anomaly-banner',
          moduleId: 'anomaly-banner',
          colSpan: 12,
          rowSpan: 2,
          title: 'Anomaly Explanation',
          visible: true,
          order: maxOrder + 1,
          config: anomalyConfig,
        })
        stores.layoutStore.setLayout(sanitizeLayout(next))
        return { status: 'applied' }
      }

      const existing = next[index]
      if (existing == null) {
        throw new Error('anomaly-banner target card was not found.')
      }
      next[index] = {
        ...existing,
        visible: true,
        config: {
          ...(existing.config ?? {}),
          ...anomalyConfig,
        },
        title: existing.title ?? 'Anomaly Explanation',
      }
      stores.layoutStore.setLayout(sanitizeLayout(next))
      return { status: 'applied' }
    }

    if (toolName === 'filter_by_relevance') {
      const visible = safeArgs['visibleModuleIds']
      const hidden = safeArgs['hiddenModuleIds']
      if (!Array.isArray(visible) || !Array.isArray(hidden)) {
        throw new Error(
          'filter_by_relevance requires visibleModuleIds and hiddenModuleIds arrays.',
        )
      }

      const visibleSet = new Set(
        visible.filter((item): item is string => typeof item === 'string'),
      )
      const hiddenSet = new Set(
        hidden.filter((item): item is string => typeof item === 'string'),
      )

      const current = stores.layoutStore.getLayout() ?? []
      const next = current.map((card) => ({
        ...card,
        visible: hiddenSet.has(card.moduleId)
          ? false
          : visibleSet.has(card.moduleId)
            ? true
            : card.visible,
      }))
      stores.layoutStore.setLayout(sanitizeLayout(next))
      return { status: 'applied' }
    }

    throw new Error(`Unsupported tool: ${toolName}`)
  } catch (error) {
    return {
      status: 'execution_failed',
      error: error instanceof Error ? error.message : 'Unknown tool execution error.',
    }
  }
}

export function logToolExecutionFailure(
  toolName: GenUiToolName,
  result: ToolValidationFailure | ToolExecutionFailure,
): void {
  writeAgentLog({
    level: 'error',
    event: 'genui_tool_failure',
    toolName,
    result,
  })
}
