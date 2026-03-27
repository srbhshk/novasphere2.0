'use client'

import { Bot } from 'lucide-react'

export default function AgentsPage(): React.JSX.Element {
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
    </div>
  )
}
