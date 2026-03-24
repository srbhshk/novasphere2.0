import type { ToolSet } from 'ai'
import { z } from 'zod'

const componentCardSchema = z.object({
  moduleId: z.string(),
  colSpan: z.number().int().min(3).max(12),
  rowSpan: z.number().int().min(1).max(3),
  title: z.string().optional(),
  order: z.number().int(),
  visible: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const renderLayoutSchema = z.preprocess(
  (input) => {
    if (typeof input !== 'object' || input == null) {
      return input
    }
    const value = input as Record<string, unknown>

    if (Array.isArray(value['cards'])) {
      return {
        cards: value['cards'],
        reasoning: typeof value['reasoning'] === 'string' ? value['reasoning'] : '',
      }
    }

    if (Array.isArray(value['board_modules'])) {
      return {
        cards: value['board_modules'],
        reasoning: typeof value['reasoning'] === 'string' ? value['reasoning'] : '',
      }
    }

    if (
      typeof value['moduleId'] === 'string' &&
      typeof value['colSpan'] === 'number' &&
      typeof value['rowSpan'] === 'number' &&
      typeof value['order'] === 'number'
    ) {
      return {
        cards: [
          {
            moduleId: value['moduleId'],
            colSpan: value['colSpan'],
            rowSpan: value['rowSpan'],
            order: value['order'],
            visible: typeof value['visible'] === 'boolean' ? value['visible'] : true,
            ...(typeof value['title'] === 'string' ? { title: value['title'] } : {}),
            ...(typeof value['config'] === 'object' && value['config'] !== null
              ? { config: value['config'] }
              : {}),
          },
        ],
        reasoning: typeof value['reasoning'] === 'string' ? value['reasoning'] : '',
      }
    }

    return input
  },
  z.object({
    cards: z.array(componentCardSchema),
    reasoning: z.string().optional(),
  }),
)

export const renderComponentSchema = z.object({
  moduleId: z.string(),
  colSpan: z.number(),
  rowSpan: z.number(),
  order: z.number(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const askClarificationSchema = z.preprocess(
  (input) => {
    if (typeof input !== 'object' || input == null) {
      return input
    }
    const value = input as Record<string, unknown>

    if (!Array.isArray(value['options']) && Array.isArray(value['question_options'])) {
      return {
        question:
          typeof value['question'] === 'string'
            ? value['question']
            : 'What are you optimizing for right now?',
        options: value['question_options'],
      }
    }

    return input
  },
  z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(5),
  }),
)

export const explainAnomalySchema = z.object({
  signals: z.array(z.string()),
  hypothesis: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  action: z.string().optional(),
})

export const filterByRelevanceSchema = z.object({
  visibleModuleIds: z.array(z.string()),
  hiddenModuleIds: z.array(z.string()),
  narrative: z.string(),
})

export const genUiTools: ToolSet = {
  render_layout: {
    description: 'Compose the dashboard layout from available modules',
    inputSchema: renderLayoutSchema,
    execute: async (input) => input,
  },
  render_component: {
    description: 'Update a single module in the current layout',
    inputSchema: renderComponentSchema,
    execute: async (input) => input,
  },
  ask_clarification: {
    description: 'Ask the user a clarifying question before acting',
    inputSchema: askClarificationSchema,
    execute: async (input) => input,
  },
  explain_anomaly: {
    description: 'Provide cross-signal reasoning about an anomaly',
    inputSchema: explainAnomalySchema,
    execute: async (input) => input,
  },
  filter_by_relevance: {
    description: 'Show or hide modules based on user goal',
    inputSchema: filterByRelevanceSchema,
    execute: async (input) => input,
  },
}

export type GenUiToolName = keyof typeof genUiTools
