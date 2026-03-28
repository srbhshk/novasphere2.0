import { NextResponse } from 'next/server'
import { convertToModelMessages } from 'ai'
import { z } from 'zod'
import { headers } from 'next/headers'
import { buildAgentContext } from '@/lib/agent/context-builder'
import { detectLayoutIntent, novaAgent } from '@/lib/agent/nova-agent'
import { genUiTools } from '@/lib/agent/genui/tools'
import { writeAgentLogWithFileSink } from '@/lib/agent/observability-server'
import { createAuth } from '@/lib/auth/auth'
import { env } from '@/lib/env'
import { getWarnModeStatus } from './warn-mode'

/** Serverless ceiling; keep above `AGENT_TURN_TIMEOUT_MS` + buffer. */
export const maxDuration = 180

type RateWindow = {
  count: number
  resetAt: number
}

const RATE_WINDOWS = new Map<string, RateWindow>()

const useChatBodySchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())),
})

function elapsedMs(startMs: number): number {
  return Date.now() - startMs
}

function getRateLimitPerMinute(): number {
  const raw = process.env['RATE_LIMIT_AGENT_RPM']
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return 20
}

function pruneExpiredRateWindows(): void {
  const now = Date.now()
  for (const [key, window] of [...RATE_WINDOWS.entries()]) {
    if (window.resetAt <= now) {
      RATE_WINDOWS.delete(key)
    }
  }
}

function checkRateLimit(key: string): boolean {
  pruneExpiredRateWindows()
  const now = Date.now()
  const windowMs = 60_000
  const limit = getRateLimitPerMinute()
  const current = RATE_WINDOWS.get(key)

  if (!current || current.resetAt <= now) {
    RATE_WINDOWS.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (current.count >= limit) {
    return false
  }
  RATE_WINDOWS.set(key, { ...current, count: current.count + 1 })
  return true
}

function getLastUserMessage(messages: Array<Record<string, unknown>>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg && msg['role'] === 'user') {
      const content = msg['content']
      if (typeof content === 'string') return content
      if (Array.isArray(content)) {
        const textPart = content.find(
          (p) =>
            p &&
            typeof p === 'object' &&
            (p as Record<string, unknown>)['type'] === 'text',
        )
        const text =
          textPart && typeof textPart === 'object' && 'text' in textPart
            ? (textPart as { text: string }).text
            : undefined
        if (typeof text === 'string') return text
      }
      return ''
    }
  }
  return ''
}

function summarizeConversationHistory(messages: Array<Record<string, unknown>>): string {
  const recent = messages.slice(-8)
  const summaryLines: string[] = []

  for (const message of recent) {
    const role = message['role']
    if (role !== 'user' && role !== 'assistant') continue

    const content = message['content']
    if (typeof content === 'string' && content.length > 0) {
      summaryLines.push(`${role}: ${content}`)
      continue
    }

    if (Array.isArray(content)) {
      const textParts = content
        .filter(
          (part): part is Record<string, unknown> =>
            typeof part === 'object' &&
            part !== null &&
            (part as Record<string, unknown>)['type'] === 'text',
        )
        .map((part) => part['text'])
        .filter((text): text is string => typeof text === 'string' && text.length > 0)
      if (textParts.length > 0) {
        summaryLines.push(`${role}: ${textParts.join(' ')}`)
      }
    }
  }

  return summaryLines.join('\n')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeUserRole(
  value: unknown,
): 'admin' | 'ceo' | 'engineer' | 'viewer' | null {
  if (
    value === 'admin' ||
    value === 'ceo' ||
    value === 'engineer' ||
    value === 'viewer'
  ) {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (
      normalized === 'admin' ||
      normalized === 'ceo' ||
      normalized === 'engineer' ||
      normalized === 'viewer'
    ) {
      return normalized
    }
  }
  return null
}

/**
 * Canonical identity for agent routes — session only (no client header trust).
 */
async function resolveAgentIdentityFromSession(): Promise<{
  userId: string
  role: 'admin' | 'ceo' | 'engineer' | 'viewer'
}> {
  try {
    const auth = await createAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    if (session == null || !isRecord(session)) {
      return { userId: 'anonymous', role: 'viewer' }
    }

    const user = session['user']
    if (!isRecord(user)) {
      return { userId: 'anonymous', role: 'viewer' }
    }

    const idRaw = user['id']
    const userId = typeof idRaw === 'string' && idRaw.length > 0 ? idRaw : 'anonymous'
    const sessionRole = normalizeUserRole(user['role'])
    return { userId, role: sessionRole ?? 'viewer' }
  } catch {
    return { userId: 'anonymous', role: 'viewer' }
  }
}

function buildAgentAbortSignal(request: Request, timeoutMs: number): AbortSignal {
  const candidates: AbortSignal[] = [request.signal]
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    candidates.push(AbortSignal.timeout(timeoutMs))
  }
  if (candidates.length === 1) {
    return candidates[0]!
  }
  return AbortSignal.any(candidates)
}

function inspectToolMarker(chunk: string): boolean {
  type JsonValue =
    | null
    | boolean
    | number
    | string
    | JsonValue[]
    | { [key: string]: JsonValue }

  function isToolType(value: unknown): value is string {
    if (typeof value !== 'string') return false
    if (value === 'tool-input-start') return true
    if (value === 'tool-output') return true
    return value.startsWith('tool-')
  }

  function containsToolEvent(value: unknown): boolean {
    if (value == null) return false
    if (Array.isArray(value)) return value.some(containsToolEvent)
    if (typeof value !== 'object') return false

    const record = value as Record<string, unknown>
    if (isToolType(record['type'])) return true

    for (const key of Object.keys(record)) {
      if (containsToolEvent(record[key])) return true
    }
    return false
  }

  function tryParseJson(text: string): JsonValue | null {
    try {
      return JSON.parse(text) as JsonValue
    } catch {
      return null
    }
  }

  const lines = chunk.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.length === 0) continue

    // SSE format: "data: {...}" or "data: [...]"
    if (line.startsWith('data:')) {
      const payload = line.slice('data:'.length).trim()
      if (payload.length === 0 || payload === '[DONE]') continue
      const parsed = tryParseJson(payload)
      if (parsed == null) continue
      if (containsToolEvent(parsed)) return true
      continue
    }

    // NDJSON / JSONL format: "{...}" or "[...]"
    if (line.startsWith('{') || line.startsWith('[')) {
      const parsed = tryParseJson(line)
      if (parsed == null) continue
      if (containsToolEvent(parsed)) return true
    }
  }

  // If this chunk contains parsable JSON and none had tool events, return false.
  // If this chunk is partial/unparseable, we intentionally return false to avoid false positives.
  return false
}

function wrapResponseWithContractLogging(
  response: Response,
  contract: {
    requiresTool: boolean
    intent: string
    role: string
    tenantId: string
    productDomain: string
    warnMode: boolean
    dayIndex: number
  },
): Response {
  if (response.body == null || !contract.requiresTool) {
    return response
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let toolDetected = false
  let carry = ''

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        if (!toolDetected && carry.length > 0 && inspectToolMarker(carry)) {
          toolDetected = true
        }
        const base = {
          intent: contract.intent,
          requiresTool: contract.requiresTool,
          toolDetected,
          role: contract.role,
          tenantId: contract.tenantId,
          productDomain: contract.productDomain,
          mode: contract.warnMode ? 'warn' : 'enforce',
          dayIndex: contract.dayIndex,
        }
        if (!toolDetected) {
          writeAgentLogWithFileSink({
            event: 'contract_violation',
            ...base,
          })
        } else {
          writeAgentLogWithFileSink({
            event: 'contract_compliant',
            ...base,
          })
        }
        controller.close()
        return
      }
      if (value) {
        const text = decoder.decode(value, { stream: true })

        // Preserve only a small tail to handle split lines across chunks.
        const combined = carry + text
        const lastNewline = combined.lastIndexOf('\n')
        if (lastNewline >= 0) {
          carry = combined.slice(lastNewline + 1)
        } else {
          carry = combined.length > 8192 ? combined.slice(-8192) : combined
        }

        if (inspectToolMarker(combined)) {
          toolDetected = true
        }
        controller.enqueue(encoder.encode(text))
      }
    },
  })

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export async function POST(request: Request): Promise<Response> {
  const requestStartedAtMs = Date.now()
  const turnId = request.headers.get('x-turn-id') ?? crypto.randomUUID()
  const identity = await resolveAgentIdentityFromSession()
  const canonicalUserId = identity.userId
  writeAgentLogWithFileSink({
    event: 'agent_timing_request_received',
    turnId,
    userId: canonicalUserId,
  })
  if (!checkRateLimit(canonicalUserId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // Safety: request payload is validated by `useChatBodySchema` before it is consumed.
  const rawBody = (await request.json()) as Record<string, unknown>

  const useChatParsed = useChatBodySchema.safeParse(rawBody)
  let userMessage: string
  let currentRoute: string
  let conversationHistory: string
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>> | undefined

  if (!useChatParsed.success || useChatParsed.data.messages.length === 0) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  writeAgentLogWithFileSink({
    event: 'agent_timing_request_validated',
    turnId,
    elapsedMs: elapsedMs(requestStartedAtMs),
  })

  // Safety: messages have passed schema validation and are object-like entries.
  userMessage = getLastUserMessage(
    useChatParsed.data.messages as Array<Record<string, unknown>>,
  )
  conversationHistory = summarizeConversationHistory(
    useChatParsed.data.messages as Array<Record<string, unknown>>,
  )
  // Safety: headers return string|null and the null case is handled by fallback.
  currentRoute = (request.headers.get('x-current-route') as string) ?? '/'
  try {
    modelMessages = await convertToModelMessages(
      // Safety: validated useChat payload matches AI SDK model message conversion input.
      useChatParsed.data.messages as Parameters<typeof convertToModelMessages>[0],
      {
        tools: genUiTools,
        ignoreIncompleteToolCalls: true,
      },
    )
  } catch {
    // Fallback for providers that reject some message-part shapes (e.g. item_reference).
    modelMessages = undefined
  }

  const contextHeaders = new Headers(request.headers)
  contextHeaders.set('x-user-id', identity.userId)
  contextHeaders.set('x-user-role', identity.role)
  contextHeaders.set('x-turn-id', turnId)

  const contextBuildStartMs = Date.now()
  const context = await buildAgentContext({
    headers: contextHeaders,
    userMessage,
    conversationHistory,
    currentRoute,
  })
  writeAgentLogWithFileSink({
    event: 'agent_timing_context_built',
    turnId,
    contextBuildMs: elapsedMs(contextBuildStartMs),
    totalElapsedMs: elapsedMs(requestStartedAtMs),
  })

  const isLayoutIntent = detectLayoutIntent(userMessage)
  const streamStartMs = Date.now()
  const abortSignal = buildAgentAbortSignal(request, env.AGENT_TURN_TIMEOUT_MS)
  const runResult =
    modelMessages != null && modelMessages.length > 0
      ? await novaAgent.stream({
          messages: modelMessages,
          options: context,
          forceRenderLayout: isLayoutIntent,
          abortSignal,
          turnTimeoutMs: env.AGENT_TURN_TIMEOUT_MS,
        })
      : await novaAgent.stream({
          prompt: userMessage,
          options: context,
          forceRenderLayout: isLayoutIntent,
          abortSignal,
          turnTimeoutMs: env.AGENT_TURN_TIMEOUT_MS,
        })
  writeAgentLogWithFileSink({
    event: 'agent_timing_ai_stream_created',
    turnId,
    aiSetupMs: elapsedMs(streamStartMs),
    totalElapsedMs: elapsedMs(requestStartedAtMs),
    layoutIntent: isLayoutIntent,
    requiresTool: context.uiContract?.requiresTool === true,
  })

  if (runResult == null || typeof runResult !== 'object') {
    return NextResponse.json({ error: 'Agent stream unavailable' }, { status: 500 })
  }

  const toUIMessageStreamResponse =
    // Safety: AI SDK stream result exposes an optional `toUIMessageStreamResponse` method.
    (runResult as { toUIMessageStreamResponse?: () => Response })
      .toUIMessageStreamResponse
  if (typeof toUIMessageStreamResponse === 'function') {
    const responseFactoryStartMs = Date.now()
    const streamResponse = toUIMessageStreamResponse.call(runResult)
    const { warnMode, dayIndex } = getWarnModeStatus()
    const wrapped = wrapResponseWithContractLogging(streamResponse, {
      requiresTool: context.uiContract?.requiresTool === true,
      intent: context.uiContract?.intent ?? 'informational_qna',
      role: context.userRole,
      tenantId: context.tenantId,
      productDomain: context.productDomain,
      warnMode,
      dayIndex,
    })

    writeAgentLogWithFileSink({
      event: 'agent_timing_stream_returned',
      turnId,
      responseFactoryMs: elapsedMs(responseFactoryStartMs),
      totalElapsedMs: elapsedMs(requestStartedAtMs),
      streamingPassthrough: true,
    })
    return wrapped
  }

  return NextResponse.json({ error: 'Agent stream format unsupported' }, { status: 500 })
}
