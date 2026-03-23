import { create } from 'zustand'

import type { TenantConfig } from '@novasphere/tenant-core'

type TenantStoreState = {
  tenant: TenantConfig | null
  isLoading: boolean
  setTenant: (tenant: TenantConfig | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useTenantStore = create<TenantStoreState>((set) => ({
  tenant: null,
  isLoading: false,
  setTenant: (tenant) => {
    set({ tenant })
  },
  setLoading: (isLoading) => {
    set({ isLoading })
  },
}))
