import type { GenUiToolName } from './tools'
import { toolInputSchemas } from './tools'

type ToolCallPart = {
  toolCallId: string
  toolName: GenUiToolName
  args: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseToolName(typeValue: unknown): GenUiToolName | null {
  if (typeof typeValue !== 'string' || !typeValue.startsWith('tool-')) {
    return null
  }
  const name = typeValue.slice(5)
  if (name in toolInputSchemas) {
    return name as GenUiToolName
  }
  return null
}

function collectToolParts(
  message: Record<string, unknown>,
  executionOnly: boolean,
): ToolCallPart[] {
  const parts = message['parts']
  if (!Array.isArray(parts)) return []

  const results: ToolCallPart[] = []
  for (const part of parts) {
    if (!isRecord(part)) continue
    const toolName = parseToolName(part['type'])
    if (toolName == null) continue

    const state = part['state']
    if (executionOnly) {
      if (state !== 'output-available') continue
    } else if (state !== 'output-available' && state !== 'input-available') {
      continue
    }

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

/** Tool parts in any streamable state (for UI that shows in-flight tools). */
export function extractToolCalls(message: Record<string, unknown>): ToolCallPart[] {
  return collectToolParts(message, false)
}

/**
 * Only finalized tool outputs — use this before `executeToolCall` so
 * `input-available` partials are not applied and `output-available` is not skipped by dedupe.
 */
export function extractToolCallsForExecution(
  message: Record<string, unknown>,
): ToolCallPart[] {
  return collectToolParts(message, true)
}

export function extractAndValidateToolCalls(
  message: Record<string, unknown>,
): ToolCallPart[] {
  return extractToolCallsForExecution(message).flatMap((toolCall) => {
    const schema = toolInputSchemas[toolCall.toolName]
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
