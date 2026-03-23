import { describe, it, expect, beforeEach } from 'vitest'
import { useAgentStore } from './agent.store'

describe('useAgentStore', () => {
  beforeEach(() => {
    useAgentStore.setState({
      status: 'idle',
      adapterType: null,
      adapterModel: null,
      downloadProgress: 0,
      isOpen: false,
    })
  })

  it('has correct initial state', () => {
    expect(useAgentStore.getState().status).toBe('idle')
    expect(useAgentStore.getState().adapterType).toBeNull()
    expect(useAgentStore.getState().adapterModel).toBeNull()
    expect(useAgentStore.getState().downloadProgress).toBe(0)
    expect(useAgentStore.getState().isOpen).toBe(false)
  })

  it('setStatus updates status', () => {
    useAgentStore.getState().setStatus('streaming')
    expect(useAgentStore.getState().status).toBe('streaming')
  })

  it('setOpen and toggleOpen work correctly', () => {
    useAgentStore.getState().setOpen(true)
    expect(useAgentStore.getState().isOpen).toBe(true)
    useAgentStore.getState().toggleOpen()
    expect(useAgentStore.getState().isOpen).toBe(false)
    useAgentStore.getState().toggleOpen()
    expect(useAgentStore.getState().isOpen).toBe(true)
  })

  it('setAdapter updates adapterType and adapterModel', () => {
    useAgentStore.getState().setAdapter('ollama', 'qwen2.5:0.5b')
    expect(useAgentStore.getState().adapterType).toBe('ollama')
    expect(useAgentStore.getState().adapterModel).toBe('qwen2.5:0.5b')
    useAgentStore.getState().setAdapter(null, null)
    expect(useAgentStore.getState().adapterType).toBeNull()
    expect(useAgentStore.getState().adapterModel).toBeNull()
  })

  it('setDownloadProgress updates downloadProgress', () => {
    useAgentStore.getState().setDownloadProgress(50)
    expect(useAgentStore.getState().downloadProgress).toBe(50)
  })
})
