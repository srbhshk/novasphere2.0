import { describe, expect, it } from 'vitest'
import { getRelevanceGatePrompt } from '../prompts'

describe('relevance gate prompt', () => {
  it('includes route and authorized dashboard summary', () => {
    const prompt = getRelevanceGatePrompt({
      productName: 'Novasphere Demo',
      productDomain: 'saas-analytics',
      productDescription: 'Demo product',
      roleInProduct: 'Engineering reliability and deployments',
      criticalSignals: ['revenue_drop', 'pipeline_stall'],
      currentRoute: '/demo/dashboard',
      dashboardContext: {
        contextDegraded: false,
        metricsCount: 2,
        activityCount: 10,
        visibleCardsCount: 0,
        criticalInsights: ['Active system alerts: 2 unresolved alerts detected.'],
        metricSignals: ['MRR: 847500 (+12.3%, up)'],
      },
      userMessage: 'What should I focus on?',
      conversationHistory: 'user: What should I focus on?',
    })

    expect(prompt).toContain('Current route:')
    expect(prompt).toContain('/demo/dashboard')
    expect(prompt).toContain('Dashboard context summary (authorized):')
    expect(prompt).toContain('metricsCount: 2')
    expect(prompt).toContain('activityCount: 10')
    expect(prompt).toContain('visibleCardsCount: 0')
    expect(prompt).toContain('Top metric signals:')
    expect(prompt).toContain('MRR: 847500 (+12.3%, up)')
    expect(prompt).toContain('Critical insights:')
    expect(prompt).toContain('Active system alerts: 2 unresolved alerts detected.')
  })
})
