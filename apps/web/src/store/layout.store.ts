import { create } from 'zustand'

import type { BentoLayoutConfig } from '@novasphere/ui-bento'
import { safeReadLayout, safeWriteLayout } from './layout-persistence'

type LayoutStoreState = {
  layout: BentoLayoutConfig | null
  isGenerating: boolean
  storageKey: string | null
  hydrate: (storageKey: string) => void
  setLayout: (layout: BentoLayoutConfig | null) => void
  getLayout: () => BentoLayoutConfig | null
  resetLayout: () => void
  setGenerating: (isGenerating: boolean) => void
}

export const useLayoutStore = create<LayoutStoreState>((set, get) => ({
  layout: null,
  isGenerating: false,
  storageKey: null,
  hydrate: (storageKey) => {
    const stored = safeReadLayout(storageKey)
    set({ storageKey, layout: stored })
  },
  setLayout: (layout) => {
    set({ layout })
    const key = get().storageKey
    if (key) safeWriteLayout(key, layout)
  },
  getLayout: () => get().layout,
  resetLayout: () => {
    set({ layout: null, isGenerating: false })
    const key = get().storageKey
    if (key) safeWriteLayout(key, null)
  },
  setGenerating: (isGenerating) => {
    set({ isGenerating })
  },
}))
