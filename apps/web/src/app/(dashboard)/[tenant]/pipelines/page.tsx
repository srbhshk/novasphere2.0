'use client'

import { GitBranch } from 'lucide-react'

export default function PipelinesPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <GitBranch className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Pipelines</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Workflow and execution monitoring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4"></div>
    </div>
  )
}
