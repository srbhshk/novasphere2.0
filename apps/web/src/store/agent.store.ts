import { create } from 'zustand'

import type { AdapterType, AgentStatus, SuggestionChip } from '@novasphere/agent-core'

type AgentPanelStoreState = {
  isOpen: boolean
  adapterType: AdapterType | null
  adapterModel: string | null
  adapterStatus: AgentStatus
  downloadProgress: number
  suggestions: SuggestionChip[]
  setOpen: (isOpen: boolean) => void
  togglePanel: () => void
  setAdapterType: (adapterType: AdapterType | null) => void
  setAdapterModel: (adapterModel: string | null) => void
  setAdapterStatus: (adapterStatus: AgentStatus) => void
  setDownloadProgress: (downloadProgress: number) => void
  setSuggestions: (suggestions: SuggestionChip[]) => void
}

export const useAgentPanelStore = create<AgentPanelStoreState>((set) => ({
  isOpen: false,
  adapterType: null,
  adapterModel: null,
  adapterStatus: 'idle',
  downloadProgress: 0,
  suggestions: [],
  setOpen: (isOpen) => {
    set({ isOpen })
  },
  togglePanel: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },
  setAdapterType: (adapterType) => {
    set({ adapterType })
  },
  setAdapterModel: (adapterModel) => {
    set({ adapterModel })
  },
  setAdapterStatus: (adapterStatus) => {
    set({ adapterStatus })
  },
  setDownloadProgress: (downloadProgress) => {
    set({ downloadProgress })
  },
  setSuggestions: (suggestions) => {
    set({ suggestions })
  },
}))
