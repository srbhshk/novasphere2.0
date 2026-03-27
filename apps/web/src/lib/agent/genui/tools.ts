import type { ToolSet } from 'ai'
import { z } from 'zod'
import type { MODULE_REGISTRY } from '@/app/(dashboard)/[tenant]/dashboard/modules/registry'

export const VALID_MODULE_IDS = [
  'metric-mrr',
  'metric-arr',
  'metric-nrr',
  'metric-churn',
  'metric-arpu',
  'metric-ltv',
  'metric-conversion',
  'metric-users',
  'metric-new-signups',
  'metric-active-orgs',
  'metric-api-latency',
  'metric-error-rate',
  'metric-uptime',
  'metric-request-volume',
  'chart-revenue',
  'chart-revenue-comparison',
  'chart-churn-trend',
  'chart-user-growth',
  'chart-top-customers',
  'chart-pipeline',
  'chart-plan-distribution',
  'chart-feature-adoption',
  'chart-response-time',
  'chart-error-breakdown',
  'chart-activity',
  'chart-sparkline',
  'customer-table',
  'pipeline-table',
  'activity-feed',
  'deployment-log',
  'system-alerts',
  'anomaly-banner',
] as const satisfies readonly (keyof typeof MODULE_REGISTRY)[]

const moduleIdSchema = z.enum(VALID_MODULE_IDS)
const confidenceSchema = z.enum(['high', 'medium', 'low'])

function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'input'
      return `${path}: ${issue.message}`
    })
    .join('; ')
}

function parseToolInputOrThrow<TSchema extends z.ZodTypeAny>(
  toolName: string,
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(input)
  if (parsed.success) {
    return parsed.data
  }

  throw new Error(`Invalid ${toolName} input. ${formatSchemaError(parsed.error)}`)
}

function createUniqueModuleIdArraySchema(fieldName: string) {
  return z.array(moduleIdSchema).superRefine((moduleIds, ctx) => {
    const seen = new Set<string>()
    for (const moduleId of moduleIds) {
      if (seen.has(moduleId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate moduleId "${moduleId}" is not allowed in ${fieldName}.`,
        })
        return
      }
      seen.add(moduleId)
    }
  })
}

const componentCardSchema = z
  .object({
    moduleId: moduleIdSchema,
    colSpan: z.number().int().min(3).max(12),
    rowSpan: z.number().int().min(1).max(3),
    title: z.string().optional(),
    order: z.number().int(),
    visible: z.boolean(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export const renderLayoutSchema = z
  .object({
    cards: z.array(componentCardSchema),
    reasoning: z.string().optional(),
    layoutMode: z.enum(['replace', 'refine']).optional(),
  })
  .strict()

export const renderComponentSchema = z
  .object({
    moduleId: moduleIdSchema,
    colSpan: z.number().int().min(3).max(12),
    rowSpan: z.number().int().min(1).max(3),
    order: z.number().int(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export const askClarificationSchema = z
  .object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(5),
  })
  .strict()

export const explainAnomalySchema = z
  .object({
    signals: z.array(z.string().min(1)).min(1),
    hypothesis: z.string().min(1),
    confidence: confidenceSchema,
  })
  .strict()

export const filterByRelevanceSchema = z
  .object({
    visibleModuleIds: createUniqueModuleIdArraySchema('visibleModuleIds'),
    hiddenModuleIds: createUniqueModuleIdArraySchema('hiddenModuleIds'),
    narrative: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hiddenModuleIdSet = new Set(value.hiddenModuleIds)
    const overlappingModuleIds = value.visibleModuleIds.filter((moduleId) =>
      hiddenModuleIdSet.has(moduleId),
    )

    if (overlappingModuleIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hiddenModuleIds'],
        message: `Module ids cannot be both visible and hidden: ${overlappingModuleIds.join(', ')}.`,
      })
    }
  })

export const genUiTools = {
  render_layout: {
    description: 'Compose the dashboard layout from available modules',
    inputSchema: renderLayoutSchema,
    execute: async (input) =>
      parseToolInputOrThrow('render_layout', renderLayoutSchema, input),
  },
  render_component: {
    description: 'Update a single module in the current layout',
    inputSchema: renderComponentSchema,
    execute: async (input) =>
      parseToolInputOrThrow('render_component', renderComponentSchema, input),
  },
  explain_anomaly: {
    description: 'Provide cross-signal reasoning about an anomaly',
    inputSchema: explainAnomalySchema,
    execute: async (input) =>
      parseToolInputOrThrow('explain_anomaly', explainAnomalySchema, input),
  },
  filter_by_relevance: {
    description: 'Show or hide modules based on user goal',
    inputSchema: filterByRelevanceSchema,
    execute: async (input) =>
      parseToolInputOrThrow('filter_by_relevance', filterByRelevanceSchema, input),
  },
} satisfies ToolSet

export type GenUiToolName = keyof typeof genUiTools

export const toolInputSchemas = {
  render_layout: renderLayoutSchema,
  render_component: renderComponentSchema,
  explain_anomaly: explainAnomalySchema,
  filter_by_relevance: filterByRelevanceSchema,
} as const
