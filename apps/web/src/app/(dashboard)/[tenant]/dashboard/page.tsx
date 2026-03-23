'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { BentoLayoutConfig } from '@novasphere/ui-bento'
import { BentoGrid } from '@novasphere/ui-bento'
import { CopilotPanel } from '@novasphere/ui-agent'
import { useMetricsList, type MetricsListResult } from '@/hooks/useMetricsList'
import { useLayoutStore } from '@/store/layout.store'
import { useAgentPanelStore } from '@/store/agent.store'
import { executeToolCall } from '@/lib/agent/genui/tool-executor'
import type { GenUiToolName } from '@/lib/agent/genui/tools'
import { MODULE_REGISTRY } from './DashboardModules'
import { novaConfig } from 'nova.config'
import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'
import type { SuggestionChip } from '@novasphere/agent-core'

const CopilotPanelNoSsr = dynamic(() => Promise.resolve(CopilotPanel), { ssr: false })

const CEO_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'm1',
    moduleId: 'metric-mrr',
    colSpan: 4,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 0,
  },
  {
    id: 'm2',
    moduleId: 'metric-churn',
    colSpan: 4,
    rowSpan: 1,
    title: 'Churn',
    visible: true,
    order: 1,
  },
  {
    id: 'm3',
    moduleId: 'metric-users',
    colSpan: 4,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 2,
  },
  {
    id: 'c1',
    moduleId: 'chart-revenue',
    colSpan: 8,
    rowSpan: 2,
    title: 'Revenue',
    visible: true,
    order: 3,
  },
  {
    id: 'c2',
    moduleId: 'chart-pipeline',
    colSpan: 4,
    rowSpan: 2,
    title: 'Pipeline',
    visible: true,
    order: 4,
  },
]

const ENGINEER_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'm1',
    moduleId: 'metric-users',
    colSpan: 4,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 0,
  },
  {
    id: 'c1',
    moduleId: 'chart-activity',
    colSpan: 8,
    rowSpan: 2,
    title: 'Activity',
    visible: true,
    order: 1,
  },
  {
    id: 'a1',
    moduleId: 'activity-feed',
    colSpan: 4,
    rowSpan: 2,
    title: 'Recent Activity',
    visible: true,
    order: 2,
  },
]

const ADMIN_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'm1',
    moduleId: 'metric-users',
    colSpan: 4,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 0,
  },
  {
    id: 'm2',
    moduleId: 'metric-mrr',
    colSpan: 4,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 1,
  },
  {
    id: 'a1',
    moduleId: 'activity-feed',
    colSpan: 4,
    rowSpan: 2,
    title: 'Activity',
    visible: true,
    order: 2,
  },
  {
    id: 'c1',
    moduleId: 'chart-pipeline',
    colSpan: 12,
    rowSpan: 2,
    title: 'Pipeline',
    visible: true,
    order: 3,
  },
]

const VIEWER_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'm1',
    moduleId: 'metric-mrr',
    colSpan: 6,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 0,
  },
  {
    id: 'm2',
    moduleId: 'metric-users',
    colSpan: 6,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 1,
  },
  {
    id: 'c1',
    moduleId: 'chart-revenue',
    colSpan: 12,
    rowSpan: 2,
    title: 'Revenue',
    visible: true,
    order: 2,
  },
]

const BOARD_MEETING_LAYOUT: BentoLayoutConfig = [
  {
    id: 'bm-1',
    moduleId: 'metric-mrr',
    colSpan: 4,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 0,
  },
  {
    id: 'bm-2',
    moduleId: 'metric-churn',
    colSpan: 4,
    rowSpan: 1,
    title: 'Churn',
    visible: true,
    order: 1,
  },
  {
    id: 'bm-3',
    moduleId: 'metric-users',
    colSpan: 4,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 2,
  },
  {
    id: 'bm-4',
    moduleId: 'chart-revenue',
    colSpan: 8,
    rowSpan: 2,
    title: 'Revenue',
    visible: true,
    order: 3,
  },
  {
    id: 'bm-5',
    moduleId: 'chart-pipeline',
    colSpan: 4,
    rowSpan: 2,
    title: 'Pipeline',
    visible: true,
    order: 4,
  },
]

function isBoardMeetingPrompt(text: string): boolean {
  return text.trim().toLowerCase() === 'show me what matters for the board meeting'
}

function isClarificationPrompt(text: string): boolean {
  return text.trim().toLowerCase() === 'make this better'
}

function normalizeAgentRole(
  role: string | undefined,
): 'admin' | 'ceo' | 'engineer' | 'viewer' {
  const r = role?.trim().toLowerCase()
  if (r === 'admin' || r === 'ceo' || r === 'engineer' || r === 'viewer') {
    return r
  }
  return 'viewer'
}

function getDefaultLayoutForRole(role: string): BentoLayoutConfig {
  if (role === 'ceo') return CEO_DEFAULT_LAYOUT
  if (role === 'engineer') return ENGINEER_DEFAULT_LAYOUT
  if (role === 'admin') return ADMIN_DEFAULT_LAYOUT
  return VIEWER_DEFAULT_LAYOUT
}

function getFirstAnomalousMetric(
  metrics: MetricsListResult,
): { metricLabel: string; value: number } | null {
  if (metrics.churn.anomaly === true) {
    return { metricLabel: 'Churn', value: metrics.churn.value }
  }
  if (metrics.mrr.anomaly === true) {
    return { metricLabel: 'MRR', value: metrics.mrr.value }
  }
  if (metrics.activeUsers.anomaly === true) {
    return { metricLabel: 'Active Users', value: metrics.activeUsers.value }
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractToolCallsFromMessage(
  message: Record<string, unknown>,
): Array<{ toolCallId: string; toolName: string; args: Record<string, unknown> }> {
  const parts = message['parts']
  if (!Array.isArray(parts)) return []

  const results: Array<{
    toolCallId: string
    toolName: string
    args: Record<string, unknown>
  }> = []
  for (const part of parts) {
    if (part && typeof part === 'object') {
      const p = part as Record<string, unknown>
      const type = p['type']
      if (typeof type === 'string' && type.startsWith('tool-')) {
        const toolName = type.slice(5) as GenUiToolName
        const argsCandidate = p['args'] ?? p['input'] ?? p['output']
        const args = isRecord(argsCandidate) ? argsCandidate : {}
        const state = p['state']
        const toolCallId =
          typeof p['toolCallId'] === 'string' ? p['toolCallId'] : `${toolName}-unknown`
        if (state === 'output-available' || state === 'input-available') {
          results.push({ toolCallId, toolName, args })
        }
      }
    }
  }
  return results
}

export default function DashboardPage(): React.JSX.Element {
  const pathname = usePathname() ?? '/'
  const { data: sessionData, isPending } = useSession()
  const authSession = useMemo(() => toAuthSession(sessionData ?? null), [sessionData])
  const agentRole = normalizeAgentRole(authSession?.role)

  const layout = useLayoutStore((s) => s.layout)
  const setLayout = useLayoutStore((s) => s.setLayout)
  const getLayout = useLayoutStore((s) => s.getLayout)
  const isGenerating = useLayoutStore((s) => s.isGenerating)
  const setGenerating = useLayoutStore((s) => s.setGenerating)
  const setSuggestions = useAgentPanelStore((s) => s.setSuggestions)
  const setAdapterType = useAgentPanelStore((s) => s.setAdapterType)
  const setAdapterModel = useAgentPanelStore((s) => s.setAdapterModel)
  const setAdapterStatus = useAgentPanelStore((s) => s.setAdapterStatus)
  const suggestions = useAgentPanelStore((s) => s.suggestions)
  const isOpen = useAgentPanelStore((s) => s.isOpen)
  const setOpen = useAgentPanelStore((s) => s.setOpen)
  const processedToolRef = useRef<Set<string>>(new Set())
  const suppressNextRenderLayoutToolRef = useRef<boolean>(false)
  const anomalyExplainedRef = useRef<boolean>(false)
  const [localLayoutNoticeAt, setLocalLayoutNoticeAt] = useState<number | null>(null)
  const [localClarificationQuestionAt, setLocalClarificationQuestionAt] = useState<
    number | null
  >(null)

  const { data: metricsData, isPending: metricsPending } = useMetricsList()
  const anomalyMetric = useMemo(
    () => (metricsData != null ? getFirstAnomalousMetric(metricsData) : null),
    [metricsData],
  )

  const userId = authSession?.userId ?? 'anonymous'
  const tenantId = authSession?.tenantId ?? 'demo'

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
        headers: {
          'x-user-id': userId,
          'x-user-role': agentRole,
          'x-tenant-id': tenantId,
          'x-current-route': pathname,
        },
      }),
    [userId, agentRole, tenantId, pathname],
  )

  const { messages, sendMessage, status } = useChat({
    transport,
  })

  useEffect(() => {
    setAdapterType('ollama')
    setAdapterModel('qwen2.5:0.5b')
    setAdapterStatus('idle')
  }, [setAdapterType, setAdapterModel, setAdapterStatus])

  useEffect(() => {
    if (isPending) {
      return
    }
    const current = useLayoutStore.getState().layout
    if (current == null) {
      setLayout(getDefaultLayoutForRole(agentRole))
    }
  }, [isPending, agentRole, setLayout])

  useEffect(() => {
    if (anomalyExplainedRef.current) {
      return
    }
    if (metricsPending) {
      return
    }
    if (anomalyMetric == null) {
      return
    }
    if (isGenerating) {
      return
    }
    if (status === 'streaming' || status === 'submitted') {
      return
    }

    anomalyExplainedRef.current = true

    const prompt = `Explain this anomaly: ${anomalyMetric.metricLabel} is ${anomalyMetric.value}`
    sendMessage({ text: prompt })
  }, [metricsPending, anomalyMetric, isGenerating, status, sendMessage])

  useEffect(() => {
    if (isPending) {
      return
    }

    const ac = new AbortController()

    void (async () => {
      setGenerating(true)
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          signal: ac.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
            'x-user-role': agentRole,
            'x-tenant-id': tenantId,
            'x-current-route': pathname,
          },
          body: JSON.stringify({
            prompt: 'Compose the initial dashboard layout for this user',
            currentRoute: pathname,
            composeInitialLayout: true,
          }),
        })
        if (!res.ok) {
          return
        }
        const data: unknown = await res.json()
        if (!isRecord(data)) {
          return
        }
        const cards = data['cards']
        if (!Array.isArray(cards) || cards.length === 0) {
          return
        }
        const layoutStore = {
          setLayout: useLayoutStore.getState().setLayout,
          getLayout: useLayoutStore.getState().getLayout,
        }
        const agentStore = {
          setSuggestions: useAgentPanelStore.getState().setSuggestions,
        }
        executeToolCall('render_layout', { cards }, {
          layoutStore,
          agentStore,
        } as Parameters<typeof executeToolCall>[2])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
      } finally {
        setGenerating(false)
      }
    })()

    return () => {
      ac.abort()
      setGenerating(false)
    }
  }, [isPending, agentRole, pathname, userId, tenantId, setGenerating])

  useEffect(() => {
    setAdapterStatus(
      status === 'streaming' ? 'streaming' : status === 'submitted' ? 'thinking' : 'idle',
    )
  }, [status, setAdapterStatus])

  useEffect(() => {
    const layoutStore = {
      setLayout: (l: Parameters<typeof setLayout>[0]) => setLayout(l),
      getLayout,
    }
    const agentStore = { setSuggestions }
    const stores = { layoutStore, agentStore }

    for (const msg of messages) {
      const m = msg as unknown as Record<string, unknown>
      const id = m['id'] as string | undefined
      if (!id) continue

      const toolCalls = extractToolCallsFromMessage(m)
      for (const { toolCallId, toolName, args } of toolCalls) {
        const key = `${id}-${toolCallId}-${toolName}`
        if (processedToolRef.current.has(key)) continue
        processedToolRef.current.add(key)
        if (suppressNextRenderLayoutToolRef.current && toolName === 'render_layout') {
          suppressNextRenderLayoutToolRef.current = false
          continue
        }
        executeToolCall(
          toolName as GenUiToolName,
          args,
          stores as Parameters<typeof executeToolCall>[2],
        )
      }
    }
  }, [messages, setLayout, getLayout, setSuggestions])

  const displayLayout = layout ?? getDefaultLayoutForRole(agentRole)
  const chatBusy = status === 'streaming' || status === 'submitted'
  const isLoading = chatBusy || isGenerating

  const streamingContent = (() => {
    const last = messages[messages.length - 1]
    if (!last || typeof last !== 'object') return undefined
    const m = last as unknown as Record<string, unknown>
    if (m['role'] !== 'assistant') return undefined
    const parts = m['parts']
    if (!Array.isArray(parts)) return undefined
    const textPart = parts.find(
      (p) =>
        p && typeof p === 'object' && (p as Record<string, unknown>)['type'] === 'text',
    )
    if (!textPart || typeof textPart !== 'object') return undefined
    const text = (textPart as Record<string, unknown>)['text']
    return typeof text === 'string' ? text : undefined
  })()

  const normalizedMessages = messages.map((m) => {
    const msg = m as unknown as Record<string, unknown>
    const parts = msg['parts'] ?? []
    const role = msg['role'] ?? 'user'
    const content = Array.isArray(parts)
      ? parts
          .filter(
            (p) =>
              p &&
              typeof p === 'object' &&
              (p as Record<string, unknown>)['type'] === 'text',
          )
          .map((p) => (p as Record<string, unknown>)['text'])
          .filter((t): t is string => typeof t === 'string')
          .join('')
      : ''
    const toolCalls = Array.isArray(parts)
      ? parts
          .filter((p) => p && typeof p === 'object')
          .map((p) => {
            const part = p as Record<string, unknown>
            const type = part['type']
            if (typeof type === 'string' && type.startsWith('tool-')) {
              return {
                id: (part['toolCallId'] as string) ?? 'tc',
                toolName: type.slice(5),
                args: (part['args'] as Record<string, unknown>) ?? {},
                result: part['output'],
              }
            }
            return null
          })
          .filter((tc): tc is NonNullable<typeof tc> => tc != null)
      : []
    return {
      id: (msg['id'] as string) ?? '',
      role: role as 'user' | 'assistant' | 'system',
      content,
      timestamp: Date.now(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    }
  })

  if (localLayoutNoticeAt != null) {
    const alreadyHasRenderLayoutTool = normalizedMessages.some((m) =>
      (m.toolCalls ?? []).some((tc) => tc.toolName === 'render_layout'),
    )
    if (!alreadyHasRenderLayoutTool) {
      normalizedMessages.push({
        id: `local-layout-${localLayoutNoticeAt}`,
        role: 'assistant',
        content: 'Updated the dashboard based on your selection.',
        timestamp: localLayoutNoticeAt,
        toolCalls: [
          {
            id: `local-render-layout-${localLayoutNoticeAt}`,
            toolName: 'render_layout',
            args: {},
            result: { source: 'local-fallback' },
          },
        ],
      })
    }
  }

  if (localClarificationQuestionAt != null) {
    const alreadyHasClarification = normalizedMessages.some(
      (m) => m.id === `local-clarification-${localClarificationQuestionAt}`,
    )
    if (!alreadyHasClarification) {
      normalizedMessages.push({
        id: `local-clarification-${localClarificationQuestionAt}`,
        role: 'assistant',
        content: 'What are you optimising for right now?',
        timestamp: localClarificationQuestionAt,
        toolCalls: undefined,
      })
    }
  }

  const bentoWrapClass = isGenerating
    ? 'min-w-0 flex-1 opacity-80 transition-opacity duration-300'
    : 'min-w-0 flex-1 transition-opacity duration-300'

  return (
    <div className="flex h-full w-full gap-4">
      <div className={bentoWrapClass}>
        <BentoGrid
          layout={displayLayout}
          modules={MODULE_REGISTRY}
          onReorder={(next) => setLayout(next)}
          className="h-full w-full"
        />
      </div>
      <div
        className={`shrink-0 transition-all duration-300 ${isOpen ? 'w-[380px]' : 'w-auto'}`}
      >
        <CopilotPanelNoSsr
          messages={normalizedMessages}
          isLoading={isLoading}
          {...(streamingContent != null ? { streamingContent } : {})}
          suggestions={suggestions}
          adapterType="ollama"
          adapterModel="qwen2.5:0.5b"
          adapterStatus={
            status === 'streaming'
              ? 'streaming'
              : status === 'submitted' || isGenerating
                ? 'thinking'
                : 'idle'
          }
          onSend={(text) => {
            if (isBoardMeetingPrompt(text)) {
              setLayout(BOARD_MEETING_LAYOUT)
              setLocalLayoutNoticeAt(Date.now())
              setLocalClarificationQuestionAt(null)
            }
            if (isClarificationPrompt(text)) {
              const options: string[] = [
                'Board presentation',
                'Daily standup',
                'Investor review',
              ]
              const chips: SuggestionChip[] = options.map((option, index) => ({
                id: `clarification-${index}`,
                label: option,
                action: option,
              }))
              setSuggestions(chips)
              setLocalClarificationQuestionAt(Date.now())
              return
            }
            sendMessage({ text })
          }}
          onSuggestionSelect={(chip) => {
            const nextLayout =
              chip.action === 'Board presentation'
                ? BOARD_MEETING_LAYOUT
                : chip.action === 'Daily standup'
                  ? ENGINEER_DEFAULT_LAYOUT
                  : chip.action === 'Investor review'
                    ? CEO_DEFAULT_LAYOUT
                    : null
            if (nextLayout != null) {
              setLayout(nextLayout)
              setLocalLayoutNoticeAt(Date.now())
            }
            suppressNextRenderLayoutToolRef.current = true
            sendMessage({ text: chip.action })
            setSuggestions([])
          }}
          isOpen={isOpen}
          onOpenChange={setOpen}
          agentName={novaConfig.agent.name}
        />
      </div>
    </div>
  )
}
