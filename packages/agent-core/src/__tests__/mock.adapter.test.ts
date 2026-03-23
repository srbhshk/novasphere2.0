import { describe, expect, it } from 'vitest'

import { MockAdapter } from '../adapters/mock.adapter'
import type { AgentContext } from '../context.types'

const context: AgentContext = {
  tenantId: 'demo',
  tenantPlan: 'pro',
  userId: 'u1',
  userRole: 'ceo',
  permissions: [],
  productName: 'novasphere',
  productDomain: 'infrastructure',
  productDescription: 'A domain-aware dashboard framework.',
  roleInProduct: 'Exec',
  criticalSignals: ['mrr', 'churn'],
  currentRoute: '/demo/dashboard',
  visibleCards: [],
  activeMetrics: [],
  recentActivity: [],
  userMessage: 'hello',
  conversationHistory: '',
  userPreferences: {},
}

describe('MockAdapter', () => {
  it('init() resolves without error', async () => {
    const adapter = new MockAdapter()
    await expect(adapter.init()).resolves.toBeUndefined()
  })

  it("chat() returns AgentResponse with role 'assistant'", async () => {
    const adapter = new MockAdapter()
    await adapter.init()
    const res = await adapter.chat({ messages: [], context })
    expect(res.message.role).toBe('assistant')
    expect(typeof res.message.content).toBe('string')
  })

  it('streamChat() calls onToken at least 3 times before resolving', async () => {
    const adapter = new MockAdapter()
    await adapter.init()
    let tokens = 0
    await adapter.streamChat({ messages: [], context }, () => {
      tokens += 1
    })
    expect(tokens).toBeGreaterThanOrEqual(3)
  })

  it("getStatus() returns 'idle' after init", async () => {
    const adapter = new MockAdapter()
    await adapter.init()
    expect(adapter.getStatus()).toBe('idle')
  })

  it('responses cycle through all 5 variants', async () => {
    const adapter = new MockAdapter()
    await adapter.init()

    const contents: string[] = []
    for (let i = 0; i < 5; i += 1) {
      const res = await adapter.chat({ messages: [], context })
      contents.push(res.message.content)
    }

    const unique = new Set(contents)
    expect(unique.size).toBe(5)
  })
})
