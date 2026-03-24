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

// Recharts relies on ResizeObserver which jsdom does not implement by default.
class ResizeObserverMock {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const globalWithResizeObserver = globalThis as typeof globalThis & {
  ResizeObserver?: typeof ResizeObserverMock
}
globalWithResizeObserver.ResizeObserver = ResizeObserverMock
