'use client'

import type { AdapterType, AgentStatus } from '@novasphere/agent-core'
import { cn } from '../lib/utils'

export type AdapterStatusBadgeProps = {
  adapterType: AdapterType | null
  status: AgentStatus
  modelName: string | null
  downloadProgress?: number
  onInfoClick?: () => void
  className?: string
}

function getLabel(props: AdapterStatusBadgeProps): string {
  const { adapterType, status, modelName } = props
  if (status === 'checking') return 'Detecting AI engine…'
  if (adapterType === 'ollama') return `Local · ${modelName ?? 'Ollama'}`
  if (adapterType === 'claude') return 'Claude'
  if (adapterType === 'openai') return 'GPT'
  if (adapterType === 'mock') return 'Demo mode'
  return '● Unknown'
}

function getDotColor(adapterType: AdapterType | null, status: AgentStatus): string {
  if (status === 'checking' || status === 'error') return 'var(--ns-color-muted)'
  if (adapterType === 'ollama') return 'var(--ns-color-success, #22c55e)'
  if (adapterType === 'claude') return 'var(--ns-color-accent, #a855f7)'
  if (adapterType === 'openai') return 'var(--ns-color-info, #14b8a6)'
  if (adapterType === 'mock') return 'var(--ns-color-muted)'
  return 'var(--ns-color-muted)'
}

export function AdapterStatusBadge({
  adapterType,
  status,
  modelName,
  downloadProgress = 0,
  onInfoClick,
  className,
}: AdapterStatusBadgeProps): React.JSX.Element {
  const label = getLabel({ adapterType, status, modelName, downloadProgress })
  const dotColor = getDotColor(adapterType, status)
  const isChecking = status === 'checking'
  const isMock = adapterType === 'mock'

  return (
    <button
      type="button"
      onClick={onInfoClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
        'border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)]',
        'text-[var(--ns-color-muted)] hover:text-[var(--ns-color-text)]',
        'focus:ring-2 focus:ring-[var(--ns-color-accent)]/50 focus:outline-none',
        className,
      )}
      aria-label={isChecking ? 'Detecting AI engine' : `AI: ${label}`}
    >
      {!isMock && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden
        />
      )}
      <span>{label}</span>
      {status === 'downloading' && downloadProgress > 0 && (
        <span className="text-[10px]">({downloadProgress}%)</span>
      )}
    </button>
  )
}
