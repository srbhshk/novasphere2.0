'use client'

import * as React from 'react'
import { GlassCard } from '@novasphere/ui-glass'

type DashboardErrorBoundaryProps = {
  children: React.ReactNode
}

type DashboardErrorBoundaryState = {
  hasError: boolean
}

export default class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  public constructor(props: DashboardErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(): DashboardErrorBoundaryState {
    return { hasError: true }
  }

  public override componentDidCatch(): void {
    // Intentionally swallowed to keep the dashboard stable for users.
  }

  public override render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <GlassCard variant="subtle" className="p-6">
        <h3 className="text-base font-semibold">Module failed to render</h3>
        <p className="mt-2 text-sm text-[color:var(--ns-color-muted)]">
          A dashboard component crashed. Reload the page to retry.
        </p>
      </GlassCard>
    )
  }
}
