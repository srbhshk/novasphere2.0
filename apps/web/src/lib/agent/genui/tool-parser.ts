import { toolInputSchemas } from './tools'

type ToolCallPart = {
  toolCallId: string
  toolName: ToolName
  args: Record<string, unknown>
}

type ToolName =
  | 'render_layout'
  | 'render_component'
  | 'explain_anomaly'
  | 'filter_by_relevance'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseToolName(typeValue: unknown): ToolName | null {
  if (typeof typeValue !== 'string' || !typeValue.startsWith('tool-')) {
    return null
  }
  const name = typeValue.slice(5)
  if (
    name === 'render_layout' ||
    name === 'render_component' ||
    name === 'explain_anomaly' ||
    name === 'filter_by_relevance'
  ) {
    return name
  }
  return null
}

const TOOL_SCHEMA_BY_NAME: Record<ToolName, (typeof toolInputSchemas)[ToolName]> = {
  render_layout: toolInputSchemas.render_layout,
  render_component: toolInputSchemas.render_component,
  explain_anomaly: toolInputSchemas.explain_anomaly,
  filter_by_relevance: toolInputSchemas.filter_by_relevance,
}

export function extractToolCalls(message: Record<string, unknown>): ToolCallPart[] {
  const parts = message['parts']
  if (!Array.isArray(parts)) return []

  const results: ToolCallPart[] = []
  for (const part of parts) {
    if (!isRecord(part)) continue
    const toolName = parseToolName(part['type'])
    if (toolName == null) continue

    const state = part['state']
    if (state !== 'output-available' && state !== 'input-available') continue

    const rawArgsCandidate = part['args'] ?? part['input'] ?? part['output']
    if (!isRecord(rawArgsCandidate)) continue

    const toolCallId =
      typeof part['toolCallId'] === 'string' ? part['toolCallId'] : `${toolName}-unknown`

    results.push({
      toolCallId,
      toolName,
      args: rawArgsCandidate,
    })
  }

  return results
}

export function extractAndValidateToolCalls(
  message: Record<string, unknown>,
): ToolCallPart[] {
  return extractToolCalls(message).flatMap((toolCall) => {
    const schema = TOOL_SCHEMA_BY_NAME[toolCall.toolName]
    const parsed = schema.safeParse(toolCall.args)
    if (!parsed.success) {
      return []
    }

    return [
      {
        ...toolCall,
        args: parsed.data as Record<string, unknown>,
      },
    ]
  })
}
