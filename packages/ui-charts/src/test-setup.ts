import '@testing-library/jest-dom/vitest'
import React from 'react'
import type { PropsWithChildren } from 'react'
import { vi } from 'vitest'

// Charts package only relies on surface of ui-glass; mock to avoid shadcn alias issues.
vi.mock('@novasphere/ui-glass', async () => {
  type GlassCardProps = PropsWithChildren<{
    className?: string
    variant?: 'subtle' | 'medium' | 'strong'
    hover?: boolean
    highlight?: boolean
  }>

  const GlassCard = ({ className, children }: GlassCardProps) =>
    React.createElement('div', { className }, children)

  const Skeleton = ({ className }: { className?: string }) =>
    React.createElement('div', { className }, null)

  return {
    GlassCard,
    Skeleton,
  }
})

// Recharts and ChartResponsiveContainer rely on ResizeObserver; jsdom has no native impl.
// Fire a callback with sane defaults when layout size is still 0×0 in tests.
class ResizeObserverMock {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    queueMicrotask(() => {
      const rect = target.getBoundingClientRect()
      const w = rect.width > 0 ? rect.width : 400
      const h = rect.height > 0 ? rect.height : 300
      const entry = {
        target,
        contentRect: new DOMRect(0, 0, w, h),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      } as ResizeObserverEntry
      this.callback([entry], this as unknown as ResizeObserver)
    })
  }
  unobserve(): void {}
  disconnect(): void {}
}

const globalWithResizeObserver = globalThis as typeof globalThis & {
  ResizeObserver?: typeof ResizeObserverMock
}
globalWithResizeObserver.ResizeObserver = ResizeObserverMock
