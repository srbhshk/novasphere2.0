import { create } from 'zustand'

import type { BentoLayoutConfig } from '@novasphere/ui-bento'

type LayoutStoreState = {
  layout: BentoLayoutConfig | null
  isGenerating: boolean
  setLayout: (layout: BentoLayoutConfig | null) => void
  getLayout: () => BentoLayoutConfig | null
  resetLayout: () => void
  setGenerating: (isGenerating: boolean) => void
}

export const useLayoutStore = create<LayoutStoreState>((set, get) => ({
  layout: null,
  isGenerating: false,
  setLayout: (layout) => {
    set({ layout })
  },
  getLayout: () => get().layout,
  resetLayout: () => {
    set({ layout: null, isGenerating: false })
  },
  setGenerating: (isGenerating) => {
    set({ isGenerating })
  },
}))
