'use client'

import dynamic from 'next/dynamic'
import * as React from 'react'

import type { SuggestionChip } from '@novasphere/agent-core'
import type { CopilotPanelProps } from '@novasphere/ui-agent'

import { useAgentPanelStore } from '@/store/agent.store'
import { novaConfig } from 'nova.config'
import { useCopilotChat } from './CopilotContext'

const CopilotPanelNoSsr = dynamic<CopilotPanelProps>(
  () => import('@novasphere/ui-agent').then((m) => ({ default: m.CopilotPanel })),
  { ssr: false },
)

function sanitizeStreamingText(raw: string): string | undefined {
  const cleaned = raw.replace(/```(?:json|JSON)?[\s\S]*?```/g, '').trim()
  if (
    (cleaned.startsWith('{') && cleaned.endsWith('}')) ||
    (cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    try {
      JSON.parse(cleaned)
      return undefined
    } catch {
      // Not valid JSON — show it
    }
  }
  return cleaned.length > 0 ? cleaned : undefined
}

/**
 * Shared copilot dock across all dashboard routes.
 * - Fixed bottom-right
 * - Constrained height so messages scroll like a chat window
 */
export default function CopilotDock(): React.JSX.Element {
  const isOpen = useAgentPanelStore((s) => s.isOpen)
  const suggestions = useAgentPanelStore((s) => s.suggestions)
  const setSuggestions = useAgentPanelStore((s) => s.setSuggestions)

  const adapterType = useAgentPanelStore((s) => s.adapterType)
  const adapterModel = useAgentPanelStore((s) => s.adapterModel)
  const adapterStatus = useAgentPanelStore((s) => s.adapterStatus)
  const downloadProgress = useAgentPanelStore((s) => s.downloadProgress)
  const setOpen = useAgentPanelStore((s) => s.setOpen)

  const { messages, sendMessage, status } = useCopilotChat()

  const chatBusy = status === 'streaming' || status === 'submitted'
  const isLoading = chatBusy

  const normalizedMessages = React.useMemo(() => {
    return messages.map((m) => {
      // Safety: AI SDK messages are object values; we narrow keys defensively below.
      const msg = m as unknown as Record<string, unknown>
      const parts = msg['parts'] ?? []
      const role = msg['role'] ?? 'user'
      const rawContent = Array.isArray(parts)
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
              // Safety: guarded by object checks before property reads.
              const part = p as Record<string, unknown>
              const type = part['type']
              if (typeof type === 'string' && type.startsWith('tool-')) {
                return {
                  id: (part['toolCallId'] as string) ?? 'tc',
                  toolName: type.slice(5),
                  // Safety: tool args payload is expected to be a plain object map.
                  args: (part['args'] as Record<string, unknown>) ?? {},
                  result: part['output'],
                }
              }
              return null
            })
            .filter((tc): tc is NonNullable<typeof tc> => tc != null)
        : []

      // CopilotPanel expects a simple message shape; it will further normalize.
      return {
        id: (msg['id'] as string) ?? '',
        role: role as 'user' | 'assistant' | 'system',
        content: rawContent,
        timestamp: typeof msg['createdAt'] === 'number' ? msg['createdAt'] : 0,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
    })
  }, [messages])

  const streamingContent = React.useMemo(() => {
    const last = messages[messages.length - 1]
    if (!last || typeof last !== 'object') return undefined
    // Safety: last message is object-like in AI SDK payloads.
    const m = last as unknown as Record<string, unknown>
    if (m['role'] !== 'assistant') return undefined
    const parts = m['parts']
    if (!Array.isArray(parts)) return undefined
    const textPart = parts.find(
      (p) =>
        p && typeof p === 'object' && (p as Record<string, unknown>)['type'] === 'text',
    )
    if (!textPart || typeof textPart !== 'object') return undefined
    const raw = (textPart as Record<string, unknown>)['text']
    if (typeof raw !== 'string') return undefined
    return sanitizeStreamingText(raw)
  }, [messages])

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40">
      <div
        className={`pointer-events-auto ${
          isOpen ? 'h-[70dvh] max-h-[560px] w-[var(--ns-copilot-width)]' : ''
        }`}
      >
        <CopilotPanelNoSsr
          messages={normalizedMessages}
          isLoading={isLoading}
          {...(streamingContent != null ? { streamingContent } : {})}
          suggestions={suggestions}
          adapterType={adapterType ?? 'ollama'}
          adapterModel={adapterModel}
          adapterStatus={
            status === 'streaming'
              ? 'streaming'
              : status === 'submitted'
                ? 'thinking'
                : adapterStatus
          }
          downloadProgress={downloadProgress}
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
          {...(isOpen ? { className: 'h-full w-full' } : {})}
        />
      </div>
    </div>
  )
}
