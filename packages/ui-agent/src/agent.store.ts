import { create } from 'zustand'
import type { AdapterType, AgentStatus } from '@novasphere/agent-core'

export type AgentStoreState = {
  status: AgentStatus
  adapterType: AdapterType | null
  adapterModel: string | null
  downloadProgress: number
  isOpen: boolean
}

export type AgentStoreActions = {
  setStatus: (status: AgentStatus) => void
  setAdapter: (type: AdapterType | null, model: string | null) => void
  setDownloadProgress: (progress: number) => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
}

const initialState: AgentStoreState = {
  status: 'idle',
  adapterType: null,
  adapterModel: null,
  downloadProgress: 0,
  isOpen: false,
}

export const useAgentStore = create<AgentStoreState & AgentStoreActions>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setAdapter: (adapterType, adapterModel) => set({ adapterType, adapterModel }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}))
