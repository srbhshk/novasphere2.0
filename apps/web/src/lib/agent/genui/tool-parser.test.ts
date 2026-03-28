import { describe, expect, it } from 'vitest'
import {
  extractAndValidateToolCalls,
  extractToolCalls,
  extractToolCallsForExecution,
} from './tool-parser'

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

  it('does not return input-available parts for execution extraction', () => {
    const message = {
      parts: [
        {
          type: 'tool-render_layout',
          state: 'input-available',
          toolCallId: 'tc-in',
          input: {
            cards: [
              {
                moduleId: 'metric-mrr',
                colSpan: 4,
                rowSpan: 1,
                order: 0,
                visible: true,
              },
            ],
          },
        },
      ],
    } as Record<string, unknown>

    expect(extractToolCallsForExecution(message)).toHaveLength(0)
    expect(extractToolCalls(message)).toHaveLength(1)
    expect(extractAndValidateToolCalls(message)).toHaveLength(0)
  })

  it('extracts ask_clarification when output is available', () => {
    const message = {
      parts: [
        {
          type: 'tool-ask_clarification',
          state: 'output-available',
          toolCallId: 'tc-q',
          output: {
            question: 'Which focus?',
            options: ['Risk', 'Growth'],
          },
        },
      ],
    } as Record<string, unknown>

    const calls = extractAndValidateToolCalls(message)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.toolName).toBe('ask_clarification')
  })
})
