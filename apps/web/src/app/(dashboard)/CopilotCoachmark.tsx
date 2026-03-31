'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { GlassCard, Button, Badge } from '@novasphere/ui-glass'

import { useAgentPanelStore } from '@/store/agent.store'

const STORAGE_KEY = 'ns_copilot_coachmark_dismissed_v1'

type CopilotCoachmarkProps = {
  /** Whether the dock is open; coachmark only shows when closed. */
  isCopilotOpen: boolean
}

export default function CopilotCoachmark({
  isCopilotOpen,
}: CopilotCoachmarkProps): React.JSX.Element | null {
  const setOpen = useAgentPanelStore((s) => s.setOpen)
  const [dismissed, setDismissed] = React.useState(true)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      setDismissed(stored === '1')
    } catch {
      // If storage is unavailable, default to not showing (avoid blocking UX).
      setDismissed(true)
    }
  }, [])

  const dismiss = React.useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Ignore
    }
  }, [])

  if (dismissed || isCopilotOpen) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Dismiss copilot hint"
        onClick={dismiss}
        className="pointer-events-auto absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Tooltip/coachmark (positioned near FAB) */}
      <div className="pointer-events-none absolute right-4 bottom-[calc(6rem+env(safe-area-inset-bottom)+5rem)] sm:right-6 sm:bottom-[calc(1.5rem+5rem)]">
        <GlassCard
          variant="strong"
          className="pointer-events-auto w-[min(20rem,calc(100vw-2rem))] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="outline">Nova Copilot</Badge>
              <div className="mt-2 text-sm font-semibold text-[var(--ns-color-text)]">
                The fastest way to understand this dashboard
              </div>
              <div className="mt-1 text-sm text-[var(--ns-color-muted)]">
                Ask for explanations, anomalies, and what to prioritize next.
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded p-1 text-[var(--ns-color-muted)] hover:bg-[var(--ns-glass-bg-subtle)] hover:text-[var(--ns-color-text)]"
              aria-label="Close hint"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                dismiss()
                setOpen(true)
              }}
            >
              Open Copilot
            </Button>
            <Button variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
