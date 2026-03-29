'use client'

import { Bot } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import { AdapterStatusBadge } from '@novasphere/ui-agent'
import { useAgentPanelStore } from '@/store/agent.store'

export default function AgentsPage(): React.JSX.Element {
  const adapterType = useAgentPanelStore((s) => s.adapterType)
  const adapterModel = useAgentPanelStore((s) => s.adapterModel)
  const adapterStatus = useAgentPanelStore((s) => s.adapterStatus)
  const suggestions = useAgentPanelStore((s) => s.suggestions)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <Bot className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Agents</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Copilot status and agent configuration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard variant="medium" className="col-span-12 p-5 xl:col-span-4">
          <div className="mb-3 text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
            Runtime Status
          </div>
          <AdapterStatusBadge
            adapterType={adapterType ?? 'ollama'}
            modelName={adapterModel}
            status={adapterStatus}
          />
        </GlassCard>

        <GlassCard variant="medium" className="col-span-12 p-5 xl:col-span-8">
          <div className="mb-3 text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
            Active Suggestions
          </div>
          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-[var(--ns-color-muted)]">
                No active clarification suggestions.
              </p>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg bg-[var(--ns-glass-bg-subtle)] px-3 py-2 text-sm text-[var(--ns-color-text)]"
                >
                  {suggestion.label}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
