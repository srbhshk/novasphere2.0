import type { ComponentType, ReactElement } from 'react'

export type BentoColSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12

export type BentoRowSpan = 1 | 2 | 3

export type BentoCardConfig = {
  id: string
  colSpan: BentoColSpan
  rowSpan: BentoRowSpan
  moduleId: string
  title?: string
  visible: boolean
  order: number
  // Using unknown and narrowing at module boundaries is required by rules.
  config?: Record<string, unknown>
}

export type BentoLayoutConfig = BentoCardConfig[]

export type BentoCardModuleProps = {
  config: BentoCardConfig
}

export type BentoModuleRegistry = Record<string, ComponentType<BentoCardModuleProps>>

export type RenderBentoModule = (config: BentoCardConfig) => ReactElement | null
