'use client'

import type { AgentMessage as AgentMessageType } from '@novasphere/agent-core'
import { GlassCard } from '@novasphere/ui-glass'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/utils'
import './AgentMessage.module.css'

export type AgentMessageProps = {
  message: AgentMessageType
  isStreaming?: boolean
  className?: string
}

function formatTime(timestamp: number): string {
  const safe = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now()
  const d = new Date(safe)
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
        {content ? (
          <div className="ns-agent-message-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              // Security: do not enable raw HTML rendering.
              components={{
                h1: ({ children }) => <h3 className="ns-agent-md-heading">{children}</h3>,
                h2: ({ children }) => <h4 className="ns-agent-md-heading">{children}</h4>,
                h3: ({ children }) => <h5 className="ns-agent-md-heading">{children}</h5>,
                p: ({ children }) => <p className="ns-agent-md-paragraph">{children}</p>,
                ul: ({ children }) => <ul className="ns-agent-md-list">{children}</ul>,
                ol: ({ children }) => (
                  <ol className="ns-agent-md-list ns-agent-md-listOrdered">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="ns-agent-md-listItem">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="ns-agent-md-strong">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ns-agent-md-link"
                  >
                    {children}
                  </a>
                ),
                pre: ({ children }) => (
                  <pre className="ns-agent-md-codeBlock">{children}</pre>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : null}
        {isStreaming && <span className="ns-agent-message-streamingCursor" aria-hidden />}
        <div className="ns-agent-message-timestamp">{formatTime(timestamp)}</div>
      </GlassCard>
    </div>
  )
}
