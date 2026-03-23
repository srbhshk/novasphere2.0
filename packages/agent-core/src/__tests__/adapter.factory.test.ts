import { describe, expect, it } from 'vitest'

import { createAdapter, isServerSide } from '../adapter.factory'

describe('adapter factory', () => {
  it("createAdapter({ type: 'mock' }) returns adapter with type 'mock'", async () => {
    const adapter = await createAdapter({ type: 'mock' })
    expect(adapter.type).toBe('mock')
  })

  it('isServerSide() returns boolean', () => {
    expect(typeof isServerSide()).toBe('boolean')
  })

  it("'auto' with unreachable Ollama URL returns MockAdapter", async () => {
    const adapter = await createAdapter({
      type: 'auto',
      ollamaUrl: 'http://127.0.0.1:1',
      ollamaModel: 'qwen2.5:0.5b',
    })
    expect(adapter.type).toBe('mock')
  })
})
