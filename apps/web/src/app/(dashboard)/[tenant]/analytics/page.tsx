'use client'

import { BarChart2 } from 'lucide-react'

export default function AnalyticsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <BarChart2 className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Analytics</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Historical trends and deep-dive charts
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-12 gap-4">{/* Revenue trend */}</div>
    </div>
  )
}
