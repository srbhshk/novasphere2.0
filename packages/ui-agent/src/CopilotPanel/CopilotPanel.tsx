'use client'

import { useRef, useEffect } from 'react'
import { Send, X, Bot } from 'lucide-react'
import type { AdapterType, AgentStatus, SuggestionChip } from '@novasphere/agent-core'
import { GlassPanel } from '@novasphere/ui-glass'
import { AdapterStatusBadge } from '../AdapterStatusBadge/AdapterStatusBadge'
import { AgentMessage } from '../AgentMessage/AgentMessage'
import { SuggestionChips } from '../SuggestionChips/SuggestionChips'
import { TypingIndicator } from '../TypingIndicator/TypingIndicator'
import { cn } from '../lib/utils'

/** Minimal shape for a message — apps/web passes UIMessage[] from useChat; we avoid @ai-sdk/react here. */
type MessageLike = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  timestamp?: number
  toolCalls?: Array<{
    id: string
    toolName: string
    args?: Record<string, unknown>
    result?: unknown
  }>
}

export type CopilotPanelProps = {
  messages: unknown[]
  isLoading: boolean
  streamingContent?: string
  suggestions?: SuggestionChip[]
  adapterType: AdapterType | null
  adapterModel: string | null
  adapterStatus: AgentStatus
  downloadProgress?: number
  onSend: (message: string) => void
  onSuggestionSelect?: (chip: SuggestionChip) => void
  onAdapterInfoClick?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  agentName?: string
  className?: string
}

function isMessageLike(m: unknown): m is MessageLike {
  if (m == null || typeof m !== 'object') return false
  const o = m as Record<string, unknown>
  return (
    typeof o.role === 'string' &&
    ['user', 'assistant', 'system'].includes(o.role as string)
  )
}

function toAgentMessage(
  m: MessageLike,
  index: number,
): {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: Array<{
    id: string
    toolName: string
    args: Record<string, unknown>
    result?: unknown
  }>
} {
  const base = {
    id: (m.id as string) ?? `msg-${index}`,
    role: m.role,
    content: m.content ?? '',
    timestamp: m.timestamp ?? Date.now(),
  }
  const mapped = m.toolCalls?.map((tc) => ({
    id: tc.id,
    toolName: tc.toolName,
    args: tc.args ?? {},
    result: tc.result,
  }))
  return mapped && mapped.length > 0 ? { ...base, toolCalls: mapped } : base
}

/**
 * Copilot panel. Intentionally stateless on AI. All AI calls are made in apps/web
 * via AI SDK 6 useChat(). This component only renders what it receives.
 */
export function CopilotPanel({
  messages,
  isLoading,
  streamingContent,
  suggestions = [],
  adapterType,
  adapterModel,
  adapterStatus,
  downloadProgress = 0,
  onSend,
  onSuggestionSelect,
  onAdapterInfoClick,
  isOpen = true,
  onOpenChange,
  agentName = 'Nova',
  className,
}: CopilotPanelProps): React.JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  const normalizedMessages = messages.filter(isMessageLike).map(toAgentMessage)
  const showDownloadBar = adapterStatus === 'downloading' && downloadProgress > 0

  const handleSubmit = (): void => {
    const raw = inputRef.current?.value?.trim()
    if (!raw || isLoading) return
    onSend(raw)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen && onOpenChange) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn('rounded-lg border border-[var(--ns-color-border)] p-2', className)}
        aria-label="Open copilot"
      >
        <Bot className="h-5 w-5 text-[var(--ns-color-muted)]" />
      </button>
    )
  }

  return (
    <GlassPanel
      variant="strong"
      className={cn('flex h-full flex-col overflow-hidden', className)}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[var(--ns-color-border)] p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ns-color-accent)]">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-[var(--ns-color-text)]">{agentName}</span>
          <AdapterStatusBadge
            adapterType={adapterType}
            status={adapterStatus}
            modelName={adapterModel}
            downloadProgress={downloadProgress}
            {...(onAdapterInfoClick ? { onInfoClick: onAdapterInfoClick } : {})}
          />
        </div>
        {onOpenChange && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-[var(--ns-color-muted)] hover:bg-[var(--ns-glass-bg-subtle)] hover:text-[var(--ns-color-text)]"
            aria-label="Close copilot"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Download progress */}
      {showDownloadBar && (
        <div className="flex-shrink-0 border-b border-[var(--ns-color-border)] px-3 py-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ns-glass-bg-subtle)]">
            <div
              className="h-full bg-[var(--ns-color-accent)] transition-[width] duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          {normalizedMessages.map((msg) => (
            <AgentMessage key={msg.id} message={msg} isStreaming={false} />
          ))}
          {streamingContent ? (
            <AgentMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: Date.now(),
              }}
              isStreaming
            />
          ) : null}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <TypingIndicator
        visible={isLoading && normalizedMessages.length > 0}
        className="px-3"
      />

      <SuggestionChips
        chips={suggestions}
        onSelect={(chip) => onSuggestionSelect?.(chip)}
        className="flex-shrink-0 px-3"
      />

      {/* Input */}
      <div className="flex flex-shrink-0 gap-2 border-t border-[var(--ns-color-border)] p-3">
        <textarea
          ref={inputRef}
          placeholder="Ask anything…"
          rows={2}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] w-full resize-none rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-3 py-2 text-sm text-[var(--ns-color-text)] placeholder:text-[var(--ns-color-muted)] focus:ring-2 focus:ring-[var(--ns-color-accent)]/50 focus:outline-none disabled:opacity-50"
          aria-label="Message"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-[var(--ns-color-accent)] text-white hover:opacity-90 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </GlassPanel>
  )
}
