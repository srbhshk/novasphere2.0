import '@testing-library/jest-dom/vitest'
import React from 'react'
import type { PropsWithChildren } from 'react'
import { vi } from 'vitest'

// Tests in this package focus on Bento behaviour, not Glass implementation.
// Mock ui-glass to avoid pulling in its internal shadcn alias configuration.
vi.mock('@novasphere/ui-glass', async () => {
  type GlassCardProps = PropsWithChildren<{
    className?: string
    variant?: 'subtle' | 'medium' | 'strong'
    hover?: boolean
    highlight?: boolean
  }>

  const GlassCard = ({ className, children }: GlassCardProps) =>
    React.createElement('div', { className }, children)

  return {
    GlassCard,
  }
})
