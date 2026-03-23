import { describe, expect, it } from 'vitest'

import { getLayoutPrompt, getSystemPrompt } from '../prompts'
import type { AgentContext } from '../context.types'
import type { ProductConfig } from '../product.types'

const mockProduct: ProductConfig = {
  name: 'novasphere',
  domain: 'infrastructure',
  description: 'A domain-aware, AI-native dashboard framework.',
  primaryMetrics: ['MRR', 'churn'],
  criticalSignals: ['mrr', 'churn'],
  terminology: { mrr: 'Monthly Recurring Revenue' },
  roleContext: {
    admin: 'Owns configuration and access.',
    ceo: 'Owns outcomes and board reporting.',
    engineer: 'Owns reliability and performance.',
    viewer: 'Read-only stakeholder.',
  },
}

const context: AgentContext = {
  tenantId: 'demo',
  tenantPlan: 'pro',
  userId: 'u1',
  userRole: 'ceo',
  permissions: [],
  productName: mockProduct.name,
  productDomain: mockProduct.domain,
  productDescription: mockProduct.description,
  roleInProduct: mockProduct.roleContext.ceo,
  criticalSignals: mockProduct.criticalSignals,
  currentRoute: '/demo/dashboard',
  visibleCards: [],
  activeMetrics: [],
  recentActivity: [],
  userMessage: 'Compose a layout',
  conversationHistory: '',
  userPreferences: {},
}

describe('prompts', () => {
  it("getSystemPrompt('ceo', mockProduct) contains product.name", () => {
    const p = getSystemPrompt('ceo', mockProduct)
    expect(p).toContain(mockProduct.name)
  })

  it("getSystemPrompt('engineer', mockProduct) contains product.domain", () => {
    const p = getSystemPrompt('engineer', mockProduct)
    expect(p).toContain(mockProduct.domain)
  })

  it("getSystemPrompt('ceo', ...) !== getSystemPrompt('engineer', ...)", () => {
    const ceo = getSystemPrompt('ceo', mockProduct)
    const eng = getSystemPrompt('engineer', mockProduct)
    expect(ceo).not.toBe(eng)
  })

  it("getLayoutPrompt contains 'tool' or 'compose' (layout instruction)", () => {
    const p = getLayoutPrompt(context).toLowerCase()
    expect(p.includes('compose') || p.includes('tool')).toBe(true)
  })
})
