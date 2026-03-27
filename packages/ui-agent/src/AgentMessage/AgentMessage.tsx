'use client'

import type { AgentMessage as AgentMessageType } from '@novasphere/agent-core'
import { GlassCard } from '@novasphere/ui-glass'
import { cn } from '../lib/utils'
import './AgentMessage.module.css'

export type AgentMessageProps = {
  message: AgentMessageType
  isStreaming?: boolean
  className?: string
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function toolChipLabel(toolName: string, args?: Record<string, unknown>): string {
  if (toolName === 'render_layout') {
    const reasoning = args?.['reasoning']
    if (
      typeof reasoning === 'string' &&
      reasoning.trim().length > 0 &&
      reasoning.length <= 80
    ) {
      return `✓ ${reasoning}`
    }
    return '✓ Dashboard updated'
  }
  if (toolName === 'filter_by_relevance') {
    const narrative = args?.['narrative']
    if (
      typeof narrative === 'string' &&
      narrative.trim().length > 0 &&
      narrative.length <= 80
    ) {
      return `✓ ${narrative}`
    }
    return '✓ Layout filtered'
  }
  if (toolName === 'explain_anomaly') return '✓ Anomaly analyzed'
  if (toolName === 'render_component') return '✓ Component updated'
  return `✓ ${toolName}`
}

export function AgentMessage({
  message,
  isStreaming = false,
  className,
}: AgentMessageProps): React.JSX.Element {
  const { role, content, timestamp, toolCalls } = message

  if (role === 'user') {
    return (
      <div className={cn('ns-agent-message-user', className)} data-role="user">
        <div>{content}</div>
        <div className="ns-agent-message-timestamp">{formatTime(timestamp)}</div>
      </div>
    )
  }

  if (role === 'system') {
    return (
      <div className={cn('ns-agent-message-system', className)}>
        <div>{content}</div>
      </div>
    )
  }

  return (
    <div className={cn('ns-agent-message-assistant', className)}>
      <GlassCard variant="medium" className="p-3">
        {toolCalls && toolCalls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {toolCalls.map((tc) => (
              <span key={tc.id} className="ns-agent-message-toolChip">
                {toolChipLabel(tc.toolName, tc.args)}
              </span>
            ))}
          </div>
        )}
        {content ? <div>{content}</div> : null}
        {isStreaming && <span className="ns-agent-message-streamingCursor" aria-hidden />}
        <div className="ns-agent-message-timestamp">{formatTime(timestamp)}</div>
      </GlassCard>
    </div>
  )
}
