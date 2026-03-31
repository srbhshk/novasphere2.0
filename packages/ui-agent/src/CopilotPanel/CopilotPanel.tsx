'use client'

import { useRef, useEffect } from 'react'
import { Bot, Send, Square, X } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
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
  /** When true (default), textarea is disabled while a turn is in flight. */
  lockInputWhileBusy?: boolean
  /** When true with `isLoading`, Send still calls `onSend` (parent may queue). */
  allowSendWhileBusy?: boolean
  /** Abort in-flight generation (from `useChat().stop`). */
  onStop?: () => void
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

function collapseAssistantMessages(
  messages: Array<ReturnType<typeof toAgentMessage>>,
): Array<ReturnType<typeof toAgentMessage>> {
  const collapsed: Array<ReturnType<typeof toAgentMessage>> = []
  for (const message of messages) {
    const prev = collapsed[collapsed.length - 1]
    if (!prev) {
      collapsed.push(message)
      continue
    }

    if (prev.role === 'assistant' && message.role === 'assistant') {
      const prevContent = prev.content.trim()
      const nextContent = message.content.trim()
      const mergedContent =
        prevContent.length > 0 && nextContent.length > 0
          ? `${prevContent}\n\n${nextContent}`
          : prevContent.length > 0
            ? prevContent
            : nextContent
      const mergedToolCalls = [...(prev.toolCalls ?? []), ...(message.toolCalls ?? [])]

      collapsed[collapsed.length - 1] = {
        ...prev,
        content: mergedContent,
        timestamp: Math.max(prev.timestamp, message.timestamp),
        ...(mergedToolCalls.length > 0 ? { toolCalls: mergedToolCalls } : {}),
      }
      continue
    }

    collapsed.push(message)
  }
  return collapsed
}

/**
 * Copilot panel. Intentionally stateless on AI. All AI calls are made in apps/web
 * via AI SDK 6 useChat(). This component only renders what it receives.
 */
export function CopilotPanel({
  messages,
  isLoading,
  lockInputWhileBusy = true,
  allowSendWhileBusy = false,
  onStop,
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
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  const normalizedMessages = collapseAssistantMessages(
    messages.filter(isMessageLike).map(toAgentMessage),
  )
  const showDownloadBar = adapterStatus === 'downloading' && downloadProgress > 0

  const blockSendWhileBusy = isLoading && !allowSendWhileBusy
  const inputLocked = lockInputWhileBusy && isLoading

  const handleSubmit = (): void => {
    const raw = inputRef.current?.value?.trim()
    if (!raw || blockSendWhileBusy) return
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
      <motion.button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          [
            // Primary FAB pill (high contrast; noticeable without animation)
            'group relative inline-flex items-center gap-2.5 rounded-full border border-[var(--ns-color-border)] px-4 py-3',
            'bg-[radial-gradient(90%_120%_at_20%_20%,var(--ns-color-accent-20),transparent_58%),linear-gradient(180deg,var(--ns-glass-bg-strong),var(--ns-glass-bg-subtle))]',
            'shadow-[0_18px_55px_rgba(0,0,0,0.55)]',
            'transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
            'active:translate-y-0 active:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
            'focus-visible:ring-2 focus-visible:ring-[var(--ns-color-accent)]/50 focus-visible:outline-none',
          ].join(' '),
          className,
        )}
        aria-label="Open copilot"
        {...(reduceMotion
          ? {}
          : {
              initial: { y: 0, scale: 1 },
              animate: {
                y: [0, -2, 0],
                scale: [1, 1.02, 1],
              },
              transition: {
                duration: 3.6,
                ease: 'easeInOut' as const,
                repeat: Number.POSITIVE_INFINITY,
              },
            })}
      >
        {/* Glow plate (static; visible even when motion disabled) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,var(--ns-color-accent-20),transparent_70%)] opacity-70 blur-md transition-opacity duration-200 group-hover:opacity-95"
        />
        <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
        </div>

        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ns-color-accent)] shadow-[0_0_0_6px_var(--ns-color-accent-10)]">
          <Bot className="h-4.5 w-4.5 text-[color:var(--ns-color-bg)]" />
        </span>

        {/* <span className="relative flex min-w-0 flex-col items-start leading-none">
          <span className="text-sm font-semibold tracking-wide text-[var(--ns-color-text)]">
            {label}
          </span>
          <span className="text-[11px] tracking-wide text-[var(--ns-color-muted)]">
            Explain, refine, prioritize
          </span>
        </span> */}

        {/* Attention dot (motion-safe only) */}
        <span
          aria-hidden="true"
          className="relative h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--ns-color-accent)] shadow-[0_0_16px_var(--ns-glow-accent)] motion-safe:animate-pulse motion-reduce:animate-none"
        />
      </motion.button>
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
        disabled={blockSendWhileBusy}
        onSelect={(chip) => {
          if (blockSendWhileBusy) return
          onSuggestionSelect?.(chip)
        }}
        className="flex-shrink-0 px-3"
      />

      {/* Input */}
      <div className="flex flex-shrink-0 gap-2 border-t border-[var(--ns-color-border)] p-3">
        <textarea
          ref={inputRef}
          placeholder="Ask about signals, risks, or how to optimize the dashboard…"
          rows={2}
          disabled={inputLocked}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] w-full resize-none rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-3 py-2 text-sm text-[var(--ns-color-text)] placeholder:text-[var(--ns-color-muted)] focus:ring-2 focus:ring-[var(--ns-color-accent)]/50 focus:outline-none disabled:opacity-50"
          aria-label="Message"
        />
        {onStop != null && isLoading ? (
          <button
            type="button"
            onClick={() => {
              onStop()
            }}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] text-[var(--ns-color-text)] hover:opacity-90"
            aria-label="Stop generation"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={blockSendWhileBusy}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-[var(--ns-color-accent)] text-white hover:opacity-90 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </GlassPanel>
  )
}
