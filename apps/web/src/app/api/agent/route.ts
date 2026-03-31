import { NextResponse } from 'next/server'
import { convertToModelMessages } from 'ai'
import { generateText, stepCountIs, streamText } from 'ai'
import { z } from 'zod'
import { headers } from 'next/headers'
import { buildAgentContext } from '@/lib/agent/context-builder'
import { detectLayoutIntent, novaAgent } from '@/lib/agent/nova-agent'
import { genUiTools } from '@/lib/agent/genui/tools'
import {
  writeAgentDebugLogWithFileSink,
  writeAgentLogWithFileSink,
} from '@/lib/agent/observability-server'
import { createAuth } from '@/lib/auth/auth'
import { env } from '@/lib/env'
import { getActiveModel } from '@/lib/agent/models'
import { getWarnModeStatus } from './warn-mode'
import { getOffTopicSystemPrompt, getRelevanceGatePrompt } from '@novasphere/agent-core'

/** Serverless ceiling; keep above `AGENT_TURN_TIMEOUT_MS` + buffer. */
export const maxDuration = 180

type RateWindow = {
  count: number
  resetAt: number
}

const RATE_WINDOWS = new Map<string, RateWindow>()

const useChatBodySchema = z.object({
  messages: z.array(
    z
      .object({
        role: z.string(),
        /**
         * AI SDK v6 UIMessage shape: `{ parts: [{ type: 'text', text: string }, ...] }`.
         * We accept unknown part shapes and only extract recognized text parts.
         */
        parts: z.array(z.record(z.string(), z.unknown())).optional(),
        /**
         * Back-compat: older clients may send `content` as a string or array of parts.
         */
        content: z.unknown().optional(),
      })
      .passthrough(),
  ),
})

type UseChatMessage = z.infer<typeof useChatBodySchema>['messages'][number]
type UseChatPart = Record<string, unknown>

function elapsedMs(startMs: number): number {
  return Date.now() - startMs
}

function isUseChatPart(value: unknown): value is UseChatPart {
  return typeof value === 'object' && value !== null
}

function extractTextFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  const chunks: string[] = []
  for (const part of parts) {
    if (!isUseChatPart(part)) continue
    if (part['type'] !== 'text') continue
    const text = part['text']
    if (typeof text === 'string' && text.length > 0) {
      chunks.push(text)
    }
  }
  return chunks.join(' ').trim()
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return extractTextFromParts(content)
  return ''
}

function pickMessageText(message: UseChatMessage): {
  text: string
  source: 'parts' | 'content' | 'none'
} {
  const fromParts = extractTextFromParts(message.parts)
  if (fromParts.length > 0) return { text: fromParts, source: 'parts' }

  const fromContent = extractTextFromContent(message.content)
  if (fromContent.length > 0) return { text: fromContent, source: 'content' }

  return { text: '', source: 'none' }
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

function getLastUserMessage(messages: UseChatMessage[]): {
  text: string
  source: 'parts' | 'content' | 'none'
} {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg && msg.role === 'user') {
      return pickMessageText(msg)
    }
  }
  return { text: '', source: 'none' }
}

function summarizeConversationHistory(messages: UseChatMessage[]): string {
  const recent = messages.slice(-8)
  const summaryLines: string[] = []

  for (const message of recent) {
    const role = message.role
    if (role !== 'user' && role !== 'assistant') continue

    const { text } = pickMessageText(message)
    if (text.length > 0) {
      summaryLines.push(`${role}: ${text}`)
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
  tenantId: string
}> {
  function readActiveOrganizationId(value: unknown): string | null {
    if (!isRecord(value)) return null
    const inner = value['session']
    if (!isRecord(inner)) return null
    const raw = inner['activeOrganizationId']
    return typeof raw === 'string' && raw.length > 0 ? raw : null
  }

  try {
    const auth = await createAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    if (session == null || !isRecord(session)) {
      return { userId: 'anonymous', role: 'viewer', tenantId: 'demo' }
    }

    const user = session['user']
    if (!isRecord(user)) {
      return { userId: 'anonymous', role: 'viewer', tenantId: 'demo' }
    }

    const idRaw = user['id']
    const userId = typeof idRaw === 'string' && idRaw.length > 0 ? idRaw : 'anonymous'
    const sessionRole = normalizeUserRole(user['role'])
    const tenantId = readActiveOrganizationId(session) ?? 'demo'
    return { userId, role: sessionRole ?? 'viewer', tenantId }
  } catch {
    return { userId: 'anonymous', role: 'viewer', tenantId: 'demo' }
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
    debugEnabled: boolean
    turnId: string
  },
): Response {
  if (response.body == null || (!contract.requiresTool && !contract.debugEnabled)) {
    return response
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let toolDetected = false
  let carry = ''
  const debugChunks: string[] = []

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
          turnId: contract.turnId,
        }
        if (!toolDetected) {
          if (contract.requiresTool) {
            writeAgentLogWithFileSink({
              event: 'contract_violation',
              ...base,
            })
          }
        } else {
          if (contract.requiresTool) {
            writeAgentLogWithFileSink({
              event: 'contract_compliant',
              ...base,
            })
          }
        }

        if (contract.debugEnabled) {
          if (carry.length > 0) {
            debugChunks.push(carry)
          }
          writeAgentDebugLogWithFileSink({
            event: 'agent_debug_stream_output_raw',
            turnId: contract.turnId,
            role: contract.role,
            tenantId: contract.tenantId,
            productDomain: contract.productDomain,
            output: debugChunks.join(''),
          })
        }
        controller.close()
        return
      }
      if (value) {
        const text = decoder.decode(value, { stream: true })
        if (contract.debugEnabled) {
          debugChunks.push(text)
        }

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

const relevanceDecisionSchema = z
  .object({
    inDomain: z.boolean(),
    reason: z.string(),
    safeReply: z.string(),
  })
  .strict()

async function runRelevanceGate(input: {
  context: Awaited<ReturnType<typeof buildAgentContext>>
}): Promise<z.infer<typeof relevanceDecisionSchema> | null> {
  const { context } = input
  const model = await getActiveModel()

  const system = getRelevanceGatePrompt({
    productName: context.productName,
    productDomain: context.productDomain,
    productDescription: context.productDescription,
    roleInProduct: context.roleInProduct,
    criticalSignals: context.criticalSignals,
    userMessage: context.userMessage,
    conversationHistory: context.conversationHistory,
  })

  const result = await generateText({
    model,
    system,
    prompt: '',
    stopWhen: stepCountIs(1),
    timeout: env.AGENT_TURN_TIMEOUT_MS,
  })

  try {
    const parsedJson: unknown = JSON.parse(result.text)
    const parsed = relevanceDecisionSchema.safeParse(parsedJson)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
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
  if (env.DEBUG_AGENT) {
    writeAgentDebugLogWithFileSink({
      event: 'agent_debug_request_body_raw',
      turnId,
      userId: identity.userId,
      role: identity.role,
      tenantId: identity.tenantId,
      body: rawBody,
    })
  }
  writeAgentLogWithFileSink({
    event: 'agent_timing_request_validated',
    turnId,
    elapsedMs: elapsedMs(requestStartedAtMs),
  })

  // Safety: messages have passed schema validation and are object-like entries.
  const lastUser = getLastUserMessage(useChatParsed.data.messages)
  userMessage = lastUser.text
  conversationHistory = summarizeConversationHistory(useChatParsed.data.messages)
  if (env.DEBUG_AGENT) {
    writeAgentDebugLogWithFileSink({
      event: 'agent_debug_user_message_extracted',
      turnId,
      userId: identity.userId,
      role: identity.role,
      tenantId: identity.tenantId,
      extracted: {
        length: userMessage.length,
        source: lastUser.source,
      },
    })
  }
  // Safety: headers return string|null and the null case is handled by fallback.
  currentRoute = (request.headers.get('x-current-route') as string) ?? '/'
  const canUseConvertedHistory = env.AI_PROVIDER !== 'openai'
  if (canUseConvertedHistory) {
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
  } else {
    // OpenAI Responses can reject historical item references from client-side UI messages.
    // For stability we run turns prompt-first and use summarized conversation in context.
    modelMessages = undefined
  }

  const contextHeaders = new Headers(request.headers)
  contextHeaders.set('x-user-id', identity.userId)
  contextHeaders.set('x-user-role', identity.role)
  contextHeaders.set('x-tenant-id', identity.tenantId)
  contextHeaders.set('x-turn-id', turnId)

  const contextBuildStartMs = Date.now()
  const context = await buildAgentContext({
    headers: contextHeaders,
    userMessage,
    conversationHistory,
    currentRoute,
  })
  if (env.DEBUG_AGENT) {
    writeAgentDebugLogWithFileSink({
      event: 'agent_debug_context_built',
      turnId,
      context,
    })
  }
  writeAgentLogWithFileSink({
    event: 'agent_timing_context_built',
    turnId,
    contextBuildMs: elapsedMs(contextBuildStartMs),
    totalElapsedMs: elapsedMs(requestStartedAtMs),
  })

  const relevance = await runRelevanceGate({ context })
  if (relevance && !relevance.inDomain) {
    writeAgentLogWithFileSink({
      event: 'agent_relevance_blocked',
      turnId,
      tenantId: context.tenantId,
      role: context.userRole,
      productDomain: context.productDomain,
      reason: relevance.reason,
    })
    if (env.DEBUG_AGENT) {
      writeAgentDebugLogWithFileSink({
        event: 'agent_debug_relevance_decision',
        turnId,
        decision: relevance,
      })
    }

    const model = await getActiveModel()
    const system = getOffTopicSystemPrompt({
      productName: context.productName,
      productDomain: context.productDomain,
      productDescription: context.productDescription,
      roleInProduct: context.roleInProduct,
    })

    const refusalStream = streamText({
      model,
      system,
      prompt: context.userMessage,
      stopWhen: stepCountIs(1),
      timeout: env.AGENT_TURN_TIMEOUT_MS,
    })
    const response = refusalStream.toUIMessageStreamResponse()
    const { warnMode, dayIndex } = getWarnModeStatus()
    return wrapResponseWithContractLogging(response, {
      requiresTool: false,
      intent: 'off_topic',
      role: context.userRole,
      tenantId: context.tenantId,
      productDomain: context.productDomain,
      warnMode,
      dayIndex,
      debugEnabled: env.DEBUG_AGENT,
      turnId,
    })
  }

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
      debugEnabled: env.DEBUG_AGENT,
      turnId,
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
