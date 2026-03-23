import type { BentoCardConfig, SuggestionChip } from '@novasphere/agent-core'
import type { GenUiToolName } from './tools'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
    colSpan: colSpan as BentoCardConfig['colSpan'],
    rowSpan: rowSpan as BentoCardConfig['rowSpan'],
    visible,
    order,
    ...(title !== undefined ? { title } : {}),
    ...(config !== undefined ? { config } : {}),
  }
}

function toSuggestionChips(options: string[]): SuggestionChip[] {
  return options.map((option, index) => ({
    id: `clarification-${index}`,
    label: option,
    action: option,
  }))
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function toConfidence(value: unknown): 'high' | 'medium' | 'low' | null {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return null
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
): void {
  if (toolName === 'render_layout') {
    const cards = args['cards']
    if (Array.isArray(cards)) {
      const parsed = cards
        .map(toBentoCardConfig)
        .filter((c): c is BentoCardConfig => c !== null)
      stores.layoutStore.setLayout(parsed)
    }
    return
  }

  if (toolName === 'render_component') {
    const current = stores.layoutStore.getLayout() ?? []
    stores.layoutStore.setLayout(patchCard(current, args))
    return
  }

  if (toolName === 'ask_clarification') {
    const optionsCandidate = args['options']
    const questionOptionsCandidate = args['question_options']
    const options = Array.isArray(optionsCandidate)
      ? optionsCandidate
      : Array.isArray(questionOptionsCandidate)
        ? questionOptionsCandidate
        : null

    if (Array.isArray(options)) {
      const safeOptions = options.filter(
        (entry): entry is string => typeof entry === 'string',
      )
      stores.agentStore.setSuggestions(toSuggestionChips(safeOptions))
    }
    return
  }

  if (toolName === 'explain_anomaly') {
    const signals = toStringArray(args['signals'])
    const hypothesis = typeof args['hypothesis'] === 'string' ? args['hypothesis'] : null
    const confidence = toConfidence(args['confidence'])

    if (signals.length === 0 || hypothesis == null || confidence == null) {
      return
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
      stores.layoutStore.setLayout(next)
      return
    }

    const existing = next[index]
    if (existing == null) {
      return
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
    stores.layoutStore.setLayout(next)
    return
  }

  if (toolName === 'filter_by_relevance') {
    const visible = args['visibleModuleIds']
    const hidden = args['hiddenModuleIds']
    if (!Array.isArray(visible) || !Array.isArray(hidden)) {
      return
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
    stores.layoutStore.setLayout(next)
  }
}
