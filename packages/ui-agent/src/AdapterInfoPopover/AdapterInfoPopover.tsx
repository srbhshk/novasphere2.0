'use client'

import * as Popover from '@radix-ui/react-popover'
import type { AdapterType, AgentStatus } from '@novasphere/agent-core'
import { GlassPanel } from '@novasphere/ui-glass'

export type AdapterInfoPopoverProps = {
  adapterType: AdapterType | null
  modelName: string | null
  status: AgentStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  className?: string
}

function getDescription(
  adapterType: AdapterType | null,
  modelName: string | null,
): React.ReactNode {
  if (adapterType === 'ollama') {
    return (
      <>
        <p className="text-sm text-[var(--ns-color-text)]">
          Running locally via Ollama. No data leaves your machine.
        </p>
        {modelName && (
          <p className="mt-1 text-xs text-[var(--ns-color-muted)]">Model: {modelName}</p>
        )}
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--ns-color-accent)] hover:underline"
        >
          ollama.com
        </a>
      </>
    )
  }
  if (adapterType === 'claude') {
    return (
      <p className="text-sm text-[var(--ns-color-text)]">
        Using Anthropic Claude. Requests are sent to Anthropic&apos;s API.
      </p>
    )
  }
  if (adapterType === 'openai') {
    return (
      <p className="text-sm text-[var(--ns-color-text)]">
        Using OpenAI-compatible API. Check your provider for data handling.
      </p>
    )
  }
  if (adapterType === 'mock') {
    return (
      <p className="text-sm text-[var(--ns-color-muted)]">
        Demo mode. No real AI is connected. Set OLLAMA_BASE_URL or an API key to use a
        live model.
      </p>
    )
  }
  return (
    <p className="text-sm text-[var(--ns-color-muted)]">
      No AI engine detected. Start Ollama or configure an API key.
    </p>
  )
}

export function AdapterInfoPopover({
  adapterType,
  modelName,
  status,
  open,
  onOpenChange,
  trigger,
  className,
}: AdapterInfoPopoverProps): React.JSX.Element {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} align="end" className={className}>
          <GlassPanel variant="strong" className="min-w-[240px] p-4">
            <h3 className="text-sm font-semibold text-[var(--ns-color-text)]">
              AI engine
            </h3>
            <div className="mt-2">{getDescription(adapterType, modelName)}</div>
            {status === 'checking' && (
              <p className="mt-2 text-xs text-[var(--ns-color-muted)]">
                Checking for Ollama…
              </p>
            )}
          </GlassPanel>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
