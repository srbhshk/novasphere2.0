import { describe, expect, it, vi } from 'vitest'
import { executeToolCall } from './tool-executor'

describe('executeToolCall', () => {
  it('returns structured validation feedback for invalid tool calls', () => {
    const layoutStore = {
      setLayout: vi.fn(),
      getLayout: () => [],
    }
    const agentStore = {
      setSuggestions: vi.fn(),
    }

    const result = executeToolCall(
      'filter_by_relevance',
      {
        visibleModuleIds: ['metric-mrr', 'KPI'],
        hiddenModuleIds: ['deployment-log'],
      },
      { layoutStore, agentStore },
    )

    expect(result.status).toBe('validation_failed')
    if (result.status !== 'validation_failed') {
      throw new Error('Expected a validation_failed result.')
    }

    expect(result.feedback).toContain('Tool call failed:')
    expect(result.feedback).toContain('Tool: filter_by_relevance')
    expect(result.issues).toContain('Missing field: narrative')
    expect(result.issues).toContain('Invalid moduleId: KPI')
    expect(layoutStore.setLayout).not.toHaveBeenCalled()
  })

  it('applies a valid tool call without retry feedback', () => {
    const layoutStore = {
      setLayout: vi.fn(),
      getLayout: () => [
        {
          id: 'metric-mrr',
          moduleId: 'metric-mrr',
          colSpan: 4 as const,
          rowSpan: 1 as const,
          title: 'MRR',
          visible: false,
          order: 0,
        },
      ],
    }
    const agentStore = {
      setSuggestions: vi.fn(),
    }

    const result = executeToolCall(
      'filter_by_relevance',
      {
        visibleModuleIds: ['metric-mrr'],
        hiddenModuleIds: [],
        narrative: 'Focus on MRR',
      },
      { layoutStore, agentStore },
    )

    expect(result.status).toBe('applied')
    expect(layoutStore.setLayout).toHaveBeenCalledTimes(1)
  })
})
