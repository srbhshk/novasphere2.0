'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { BentoLayoutConfig } from '@novasphere/ui-bento'
import { BentoGrid } from '@novasphere/ui-bento'
import { GlassCard, Skeleton } from '@novasphere/ui-glass'
import { useMetricsList } from '@/hooks/useMetricsList'
import { useLayoutStore } from '@/store/layout.store'
import { useAgentPanelStore } from '@/store/agent.store'
import { executeToolCall, logToolExecutionFailure } from '@/lib/agent/genui/tool-executor'
import type { GenUiToolName } from '@/lib/agent/genui/tools'
import { extractToolCallsForExecution } from '@/lib/agent/genui/tool-parser'
import { MODULE_REGISTRY } from './modules/registry'
import { useSession } from '@/lib/auth/auth-client'
import { toAuthSession } from '@/lib/auth/better-auth-adapter'
import type { SuggestionChip } from '@novasphere/agent-core'
import { classifyUiIntent, requiresToolForIntent } from '@novasphere/agent-core'
import type { AdapterType } from '@novasphere/agent-core'
import type { MetricsListResult } from '@/hooks/useMetricsList'
import { useCopilotChat } from '../../CopilotContext'
import DashboardErrorBoundary from '../../DashboardErrorBoundary'

const TOOL_RETRY_FEEDBACK_PREFIX = 'Tool call failed:'
type AgentRuntimeStatusResponse = {
  adapterType: AdapterType
  adapterModel: string
}

function isAgentRuntimeStatusResponse(
  value: unknown,
): value is AgentRuntimeStatusResponse {
  if (typeof value !== 'object' || value == null) return false
  // Safety: guarded by object/null checks immediately above.
  const record = value as Record<string, unknown>
  const adapterType = record['adapterType']
  const adapterModel = record['adapterModel']
  const validType =
    adapterType === 'ollama' ||
    adapterType === 'claude' ||
    adapterType === 'openai' ||
    adapterType === 'mock'
  return validType && typeof adapterModel === 'string' && adapterModel.length > 0
}

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

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage(): React.JSX.Element {
  const { data: sessionData, isPending } = useSession()
  const authSession = useMemo(() => toAuthSession(sessionData ?? null), [sessionData])
  const agentRole = normalizeAgentRole(authSession?.role)
  const hasResolvedSession = !isPending && authSession != null

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
  const processedToolRef = useRef<Set<string>>(new Set())
  const initialBootstrapSentRef = useRef<boolean>(false)
  const toolRetryCountRef = useRef<number>(0)

  const { messages, sendMessage, status } = useCopilotChat()

  // Use legacy hook for anomaly detection only (role-scoped data via useDashboardMetrics in modules)
  const { data: metricsData, isPending: metricsPending } = useMetricsList(agentRole)
  const anomalyMetric = useMemo(
    () => (metricsData != null ? getFirstAnomalousMetric(metricsData) : null),
    [metricsData],
  )

  useEffect(() => {
    let mounted = true
    setAdapterType('ollama')
    setAdapterModel(null)
    setAdapterStatus('idle')

    void (async () => {
      try {
        const response = await fetch('/api/agent/status', { method: 'GET' })
        if (!response.ok) return
        const payload: unknown = await response.json()
        if (!isAgentRuntimeStatusResponse(payload)) return
        if (!mounted) return
        setAdapterType(payload.adapterType)
        setAdapterModel(payload.adapterModel)
      } catch {
        // Keep optimistic local defaults when runtime status endpoint is unavailable.
      }
    })()

    return () => {
      mounted = false
    }
  }, [setAdapterType, setAdapterModel, setAdapterStatus])

  // Single bootstrap turn: anomaly + initial layout in one request when data shows an anomaly,
  // otherwise layout-only. Avoids racing two effects on `messages.length`.
  useEffect(() => {
    if (isPending || !hasResolvedSession) return
    if (metricsPending) return
    if (status === 'submitted' || status === 'streaming') return
    if (initialBootstrapSentRef.current) return

    initialBootstrapSentRef.current = true
    setGenerating(true)
    if (anomalyMetric != null) {
      sendMessage({
        text: `Explain this anomaly: ${anomalyMetric.metricLabel} is ${anomalyMetric.value}. Then compose the initial dashboard layout for this user (role: ${agentRole}) using the render_layout tool with role-appropriate modules.`,
      })
    } else {
      sendMessage({
        text: 'Compose the initial dashboard layout for this user.',
      })
    }
  }, [
    agentRole,
    anomalyMetric,
    hasResolvedSession,
    isPending,
    metricsPending,
    sendMessage,
    setGenerating,
    status,
  ])

  useEffect(() => {
    if (status === 'ready') {
      setGenerating(false)
      const currentLayout = useLayoutStore.getState().getLayout()
      if (currentLayout == null || currentLayout.length === 0) {
        useLayoutStore.getState().setLayout(getDefaultLayoutForRole(agentRole))
      }
    }
  }, [agentRole, setGenerating, status])

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
      // Safety: UI messages are object-like and are narrowed before key access.
      const m = msg as unknown as Record<string, unknown>
      const id = m['id'] as string | undefined
      if (!id) continue
      const toolCalls = extractToolCallsForExecution(m)
      for (const { toolCallId, toolName, args } of toolCalls) {
        const key = `${id}-${toolCallId}-${toolName}`
        if (processedToolRef.current.has(key)) continue
        processedToolRef.current.add(key)

        const result = executeToolCall(
          // Safety: toolName comes from parsed tool payload matched against registered names.
          toolName as GenUiToolName,
          args,
          // Safety: stores object matches executeToolCall store contract shape.
          stores as Parameters<typeof executeToolCall>[2],
        )

        if (result.status === 'applied') {
          toolRetryCountRef.current = 0
          continue
        }

        if (result.status === 'validation_failed') {
          if (toolRetryCountRef.current < 1) {
            toolRetryCountRef.current += 1
            sendMessage({ text: result.feedback })
            continue
          }

          logToolExecutionFailure(toolName, result)
          continue
        }

        logToolExecutionFailure(toolName, result)
      }
    }
  }, [messages, setLayout, getLayout, sendMessage, setSuggestions])

  useEffect(() => {
    const lastUser = [...messages]
      .reverse()
      .find(
        (message) =>
          ((message as unknown as Record<string, unknown>)['role'] as
            | string
            | undefined) === 'user',
      )

    if (!lastUser) return

    // Safety: AI message entries are narrowed to object records before field reads.
    const lastUserRecord = lastUser as unknown as Record<string, unknown>
    const parts = lastUserRecord['parts']
    const text = Array.isArray(parts)
      ? parts
          .filter(
            (part) =>
              part &&
              typeof part === 'object' &&
              (part as Record<string, unknown>)['type'] === 'text',
          )
          .map((part) => (part as Record<string, unknown>)['text'])
          .find((value): value is string => typeof value === 'string')
      : ''

    if (typeof text === 'string' && !text.startsWith(TOOL_RETRY_FEEDBACK_PREFIX)) {
      toolRetryCountRef.current = 0
    }
  }, [messages])

  useEffect(() => {
    if (status !== 'ready') return
    if (messages.length < 2) return

    const lastAssistant = messages[messages.length - 1]
    const lastUser = [...messages]
      .reverse()
      .find(
        (message) =>
          ((message as unknown as Record<string, unknown>)['role'] as
            | string
            | undefined) === 'user',
      )
    if (!lastAssistant || !lastUser) return

    // Safety: both messages are object-like records after array/role guards.
    const assistantRecord = lastAssistant as unknown as Record<string, unknown>
    // Safety: both messages are object-like records after array/role guards.
    const userRecord = lastUser as unknown as Record<string, unknown>
    const assistantToolCalls = extractToolCallsForExecution(assistantRecord)
    if (assistantToolCalls.length > 0) return

    const userParts = userRecord['parts']
    const userText = Array.isArray(userParts)
      ? userParts
          .filter(
            (part) =>
              part &&
              typeof part === 'object' &&
              (part as Record<string, unknown>)['type'] === 'text',
          )
          .map((part) => (part as Record<string, unknown>)['text'])
          .find((value): value is string => typeof value === 'string')
      : ''

    const intent = classifyUiIntent(userText ?? '')
    if (!requiresToolForIntent(intent)) return
    if (suggestions.length > 0) return

    const fallbackSuggestions: SuggestionChip[] = [
      {
        id: 'clarify-focus',
        label: 'Focus on top risks first',
        action: 'Focus on top risk signals while keeping the current layout.',
      },
      {
        id: 'clarify-balance',
        label: 'Balance risks and growth',
        action: 'Balance risk and growth signals in the current layout.',
      },
      {
        id: 'clarify-visual',
        label: 'Prefer minimal visual changes',
        action: 'Keep layout changes minimal and explain what changed.',
      },
    ]
    setSuggestions(fallbackSuggestions)
  }, [messages, setSuggestions, status, suggestions.length])

  return (
    <div className="min-h-0 w-full">
      <DashboardErrorBoundary>
        {layout == null && isGenerating ? (
          // Skeleton state: LLM is composing the initial layout
          <div className="grid w-full auto-rows-[minmax(120px,auto)] grid-cols-12 gap-4">
            {(
              [
                { spanClass: 'col-span-4 row-span-1', rows: 1 },
                { spanClass: 'col-span-4 row-span-1', rows: 1 },
                { spanClass: 'col-span-4 row-span-1', rows: 1 },
                { spanClass: 'col-span-8 row-span-2', rows: 2 },
                { spanClass: 'col-span-4 row-span-2', rows: 2 },
                { spanClass: 'col-span-6 row-span-2', rows: 2 },
                { spanClass: 'col-span-6 row-span-2', rows: 2 },
              ] as Array<{ spanClass: string; rows: number }>
            ).map((cell, i) => (
              <GlassCard
                key={i}
                variant="subtle"
                className={`flex h-full flex-col gap-3 p-4 ${cell.spanClass}`}
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
      </DashboardErrorBoundary>
    </div>
  )
}
