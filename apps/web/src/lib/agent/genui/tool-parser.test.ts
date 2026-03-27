import { describe, expect, it } from 'vitest'
import { extractAndValidateToolCalls } from './tool-parser'

describe('extractAndValidateToolCalls', () => {
  it('extracts valid tool calls', () => {
    const message = {
      parts: [
        {
          type: 'tool-render_layout',
          state: 'output-available',
          toolCallId: 'tc-1',
          output: {
            cards: [
              {
                moduleId: 'metric-mrr',
                colSpan: 4,
                rowSpan: 1,
                order: 0,
                visible: true,
              },
            ],
            layoutMode: 'refine',
          },
        },
      ],
    } as Record<string, unknown>

    const calls = extractAndValidateToolCalls(message)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.toolName).toBe('render_layout')
  })

  it('skips invalid schemas', () => {
    const message = {
      parts: [
        {
          type: 'tool-render_layout',
          state: 'output-available',
          toolCallId: 'tc-2',
          output: {
            cards: [
              { moduleId: 'metric-mrr', colSpan: 1, rowSpan: 9, order: 0, visible: true },
            ],
          },
        },
      ],
    } as Record<string, unknown>

    const calls = extractAndValidateToolCalls(message)
    expect(calls).toHaveLength(0)
  })
})
