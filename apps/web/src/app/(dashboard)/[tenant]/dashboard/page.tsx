'use client'

import { useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { CopilotPanel } from '@novasphere/ui-agent'
import type { CopilotPanelProps } from '@novasphere/ui-agent'
import { usePathname } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { BentoLayoutConfig } from '@novasphere/ui-bento'
import { BentoGrid } from '@novasphere/ui-bento'
import { GlassCard, Skeleton } from '@novasphere/ui-glass'
import { useMetricsList } from '@/hooks/useMetricsList'
import { useLayoutStore } from '@/store/layout.store'
import { useAgentPanelStore } from '@/store/agent.store'
import { executeToolCall } from '@/lib/agent/genui/tool-executor'
import type { GenUiToolName } from '@/lib/agent/genui/tools'
import { MODULE_REGISTRY } from './modules/registry'
import { novaConfig } from 'nova.config'
import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'
import type { SuggestionChip } from '@novasphere/agent-core'
import type { MetricsListResult } from '@/hooks/useMetricsList'

const CopilotPanelNoSsr = dynamic<CopilotPanelProps>(
  () => Promise.resolve({ default: CopilotPanel }),
  { ssr: false },
)

// ---------------------------------------------------------------------------
// Role-based default layouts
// ---------------------------------------------------------------------------

const CEO_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'c-m1',
    moduleId: 'metric-mrr',
    colSpan: 4,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 0,
  },
  {
    id: 'c-m2',
    moduleId: 'metric-arr',
    colSpan: 4,
    rowSpan: 1,
    title: 'ARR',
    visible: true,
    order: 1,
  },
  {
    id: 'c-m3',
    moduleId: 'metric-nrr',
    colSpan: 4,
    rowSpan: 1,
    title: 'Net Revenue Retention',
    visible: true,
    order: 2,
  },
  {
    id: 'c-m4',
    moduleId: 'metric-churn',
    colSpan: 3,
    rowSpan: 1,
    title: 'Churn Rate',
    visible: true,
    order: 3,
  },
  {
    id: 'c-m5',
    moduleId: 'metric-arpu',
    colSpan: 3,
    rowSpan: 1,
    title: 'ARPU',
    visible: true,
    order: 4,
  },
  {
    id: 'c-m6',
    moduleId: 'metric-ltv',
    colSpan: 3,
    rowSpan: 1,
    title: 'Customer LTV',
    visible: true,
    order: 5,
  },
  {
    id: 'c-m7',
    moduleId: 'metric-conversion',
    colSpan: 3,
    rowSpan: 1,
    title: 'Trial Conversion',
    visible: true,
    order: 6,
  },
  {
    id: 'c-c1',
    moduleId: 'chart-revenue-comparison',
    colSpan: 8,
    rowSpan: 2,
    title: 'Revenue vs Prior Year',
    visible: true,
    order: 7,
  },
  {
    id: 'c-c2',
    moduleId: 'chart-pipeline',
    colSpan: 4,
    rowSpan: 2,
    title: 'Pipeline by Stage',
    visible: true,
    order: 8,
  },
  {
    id: 'c-t1',
    moduleId: 'chart-top-customers',
    colSpan: 6,
    rowSpan: 2,
    title: 'Top Customers by MRR',
    visible: true,
    order: 9,
  },
  {
    id: 'c-t2',
    moduleId: 'customer-table',
    colSpan: 6,
    rowSpan: 2,
    title: 'Customer Health',
    visible: true,
    order: 10,
  },
]

const ENGINEER_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'e-m1',
    moduleId: 'metric-api-latency',
    colSpan: 3,
    rowSpan: 1,
    title: 'API Latency',
    visible: true,
    order: 0,
  },
  {
    id: 'e-m2',
    moduleId: 'metric-error-rate',
    colSpan: 3,
    rowSpan: 1,
    title: 'Error Rate',
    visible: true,
    order: 1,
  },
  {
    id: 'e-m3',
    moduleId: 'metric-uptime',
    colSpan: 3,
    rowSpan: 1,
    title: 'Uptime',
    visible: true,
    order: 2,
  },
  {
    id: 'e-m4',
    moduleId: 'metric-request-volume',
    colSpan: 3,
    rowSpan: 1,
    title: 'Requests / Day',
    visible: true,
    order: 3,
  },
  {
    id: 'e-c1',
    moduleId: 'chart-response-time',
    colSpan: 8,
    rowSpan: 2,
    title: 'Response Time (24h)',
    visible: true,
    order: 4,
  },
  {
    id: 'e-c2',
    moduleId: 'chart-error-breakdown',
    colSpan: 4,
    rowSpan: 2,
    title: 'Errors by Endpoint',
    visible: true,
    order: 5,
  },
  {
    id: 'e-f1',
    moduleId: 'deployment-log',
    colSpan: 6,
    rowSpan: 2,
    title: 'Recent Deployments',
    visible: true,
    order: 6,
  },
  {
    id: 'e-f2',
    moduleId: 'system-alerts',
    colSpan: 6,
    rowSpan: 2,
    title: 'System Alerts',
    visible: true,
    order: 7,
  },
]

const ADMIN_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'a-m1',
    moduleId: 'metric-users',
    colSpan: 4,
    rowSpan: 1,
    title: 'Total Users',
    visible: true,
    order: 0,
  },
  {
    id: 'a-m2',
    moduleId: 'metric-new-signups',
    colSpan: 4,
    rowSpan: 1,
    title: 'New Signups / Week',
    visible: true,
    order: 1,
  },
  {
    id: 'a-m3',
    moduleId: 'metric-active-orgs',
    colSpan: 4,
    rowSpan: 1,
    title: 'Active Orgs',
    visible: true,
    order: 2,
  },
  {
    id: 'a-c1',
    moduleId: 'chart-plan-distribution',
    colSpan: 4,
    rowSpan: 2,
    title: 'Plan Distribution',
    visible: true,
    order: 3,
  },
  {
    id: 'a-c2',
    moduleId: 'chart-user-growth',
    colSpan: 8,
    rowSpan: 2,
    title: 'User Growth',
    visible: true,
    order: 4,
  },
  {
    id: 'a-f1',
    moduleId: 'activity-feed',
    colSpan: 6,
    rowSpan: 2,
    title: 'Activity Feed',
    visible: true,
    order: 5,
  },
  {
    id: 'a-t1',
    moduleId: 'pipeline-table',
    colSpan: 6,
    rowSpan: 2,
    title: 'Active Pipeline',
    visible: true,
    order: 6,
  },
]

const VIEWER_DEFAULT_LAYOUT: BentoLayoutConfig = [
  {
    id: 'v-m1',
    moduleId: 'metric-mrr',
    colSpan: 6,
    rowSpan: 1,
    title: 'MRR',
    visible: true,
    order: 0,
  },
  {
    id: 'v-m2',
    moduleId: 'metric-users',
    colSpan: 6,
    rowSpan: 1,
    title: 'Active Users',
    visible: true,
    order: 1,
  },
  {
    id: 'v-c1',
    moduleId: 'chart-revenue',
    colSpan: 8,
    rowSpan: 2,
    title: 'Revenue',
    visible: true,
    order: 2,
  },
  {
    id: 'v-c2',
    moduleId: 'chart-pipeline',
    colSpan: 4,
    rowSpan: 2,
    title: 'Pipeline',
    visible: true,
    order: 3,
  },
  {
    id: 'v-f1',
    moduleId: 'activity-feed',
    colSpan: 12,
    rowSpan: 2,
    title: 'Activity Feed',
    visible: true,
    order: 4,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

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
  const anomalyExplainedRef = useRef<boolean>(false)

  // Use legacy hook for anomaly detection only (role-scoped data via useDashboardMetrics in modules)
  const { data: metricsData, isPending: metricsPending } = useMetricsList(agentRole)
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

  const { messages, sendMessage, status } = useChat({ transport })

  useEffect(() => {
    setAdapterType('ollama')
    setAdapterModel('qwen2.5:0.5b')
    setAdapterStatus('idle')
  }, [setAdapterType, setAdapterModel, setAdapterStatus])

  // Auto-explain anomaly once on load
  useEffect(() => {
    if (anomalyExplainedRef.current) return
    if (metricsPending || anomalyMetric == null || isGenerating) return
    if (status === 'streaming' || status === 'submitted') return
    anomalyExplainedRef.current = true
    sendMessage({
      text: `Explain this anomaly: ${anomalyMetric.metricLabel} is ${anomalyMetric.value}`,
    })
  }, [metricsPending, anomalyMetric, isGenerating, status, sendMessage])

  // Compose initial layout from the AI on first load.
  // LLM is the controller — it decides the layout for this role.
  // Falls back to the static role default only when the model is unavailable.
  useEffect(() => {
    if (isPending) return
    const ac = new AbortController()

    void (async () => {
      setGenerating(true)
      let aiLayoutApplied = false
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
        if (res.ok) {
          const data: unknown = await res.json()
          if (isRecord(data)) {
            const cards = data['cards']
            if (Array.isArray(cards) && cards.length > 0) {
              executeToolCall('render_layout', { cards }, {
                layoutStore: {
                  setLayout: useLayoutStore.getState().setLayout,
                  getLayout: useLayoutStore.getState().getLayout,
                },
                agentStore: {
                  setSuggestions: useAgentPanelStore.getState().setSuggestions,
                },
              } as Parameters<typeof executeToolCall>[2])
              aiLayoutApplied = true
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (err instanceof Error && err.name === 'AbortError') return
      } finally {
        // Fallback: if the LLM did not produce a layout, use the static role default
        if (!aiLayoutApplied) {
          useLayoutStore.getState().setLayout(getDefaultLayoutForRole(agentRole))
        }
        setGenerating(false)
      }
    })()

    return () => {
      ac.abort()
      setGenerating(false)
    }
  }, [isPending, agentRole, pathname, userId, tenantId, setGenerating])

  // Mirror streaming status to agent store
  useEffect(() => {
    setAdapterStatus(
      status === 'streaming' ? 'streaming' : status === 'submitted' ? 'thinking' : 'idle',
    )
  }, [status, setAdapterStatus])

  // Apply tool calls from AI SDK messages
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
        executeToolCall(
          toolName as GenUiToolName,
          args,
          stores as Parameters<typeof executeToolCall>[2],
        )
      }
    }
  }, [messages, setLayout, getLayout, setSuggestions])

  const chatBusy = status === 'streaming' || status === 'submitted'
  const isLoading = chatBusy || isGenerating

  // Extract streaming text for the copilot panel
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

  // Normalize AI SDK v6 UIMessage[] → AgentMessage[] for CopilotPanel
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

  return (
    <div className="flex h-full w-full gap-4">
      <div className="min-w-0 flex-1 transition-opacity duration-300">
        {layout == null && isGenerating ? (
          // Skeleton state: LLM is composing the initial layout
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
              gridAutoRows: 'minmax(120px, auto)',
              gap: '16px',
              width: '100%',
            }}
          >
            {(
              [
                { cols: 4, rows: 1 },
                { cols: 4, rows: 1 },
                { cols: 4, rows: 1 },
                { cols: 8, rows: 2 },
                { cols: 4, rows: 2 },
                { cols: 6, rows: 2 },
                { cols: 6, rows: 2 },
              ] as Array<{ cols: number; rows: number }>
            ).map((cell, i) => (
              <GlassCard
                key={i}
                variant="subtle"
                className="flex h-full flex-col gap-3 p-4"
                style={{
                  gridColumn: `span ${cell.cols} / span ${cell.cols}`,
                  gridRow: `span ${cell.rows} / span ${cell.rows}`,
                }}
              >
                <Skeleton rounded="md" className="h-4 w-1/3" />
                <Skeleton rounded="md" className="h-8 w-2/3" />
                {cell.rows > 1 && <Skeleton rounded="md" className="flex-1" />}
              </GlassCard>
            ))}
          </div>
        ) : (
          <BentoGrid
            layout={layout ?? getDefaultLayoutForRole(agentRole)}
            modules={MODULE_REGISTRY}
            onReorder={(next) => setLayout(next)}
            className="h-full w-full"
          />
        )}
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
          onSend={(text: string) => {
            sendMessage({ text })
          }}
          onSuggestionSelect={(chip: SuggestionChip) => {
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
