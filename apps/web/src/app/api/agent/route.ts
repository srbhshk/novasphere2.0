import { NextResponse } from 'next/server'
import { convertToModelMessages } from 'ai'
import { z } from 'zod'
import { headers } from 'next/headers'
import { buildAgentContext } from '@/lib/agent/context-builder'
import { detectLayoutIntent, novaAgent } from '@/lib/agent/nova-agent'
import { genUiTools, renderLayoutSchema } from '@/lib/agent/genui/tools'
import { writeAgentLog } from '@/lib/agent/observability'
import { createAuth } from '@/lib/auth/auth'

type RateWindow = {
  count: number
  resetAt: number
}

const RATE_WINDOWS = new Map<string, RateWindow>()

const useChatBodySchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())),
})

const WARN_MODE_DAYS = 21

function getRateLimitPerMinute(): number {
  const raw = process.env['RATE_LIMIT_AGENT_RPM']
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return 20
}

function checkRateLimit(key: string): boolean {
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

async function resolveRoleFromSessionOrHeader(
  request: Request,
): Promise<'admin' | 'ceo' | 'engineer' | 'viewer'> {
  const headerRole = normalizeUserRole(request.headers.get('x-user-role'))

  try {
    const auth = await createAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    if (session == null || !isRecord(session)) {
      return headerRole ?? 'viewer'
    }

    const user = session['user']
    if (!isRecord(user)) {
      return headerRole ?? 'viewer'
    }

    const sessionRole = normalizeUserRole(user['role'])
    return sessionRole ?? headerRole ?? 'viewer'
  } catch {
    return headerRole ?? 'viewer'
  }
}

export function getWarnModeStatus(now: number = Date.now()): {
  warnMode: boolean
  dayIndex: number
} {
  const sinceMs = now - Date.UTC(2026, 2, 24, 0, 0, 0, 0)
  const dayIndex = Math.floor(sinceMs / 86_400_000) + 1
  return { warnMode: dayIndex <= WARN_MODE_DAYS, dayIndex }
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
  let sawParsableJson = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.length === 0) continue

    // SSE format: "data: {...}" or "data: [...]"
    if (line.startsWith('data:')) {
      const payload = line.slice('data:'.length).trim()
      if (payload.length === 0 || payload === '[DONE]') continue
      const parsed = tryParseJson(payload)
      if (parsed == null) continue
      sawParsableJson = true
      if (containsToolEvent(parsed)) return true
      continue
    }

    // NDJSON / JSONL format: "{...}" or "[...]"
    if (line.startsWith('{') || line.startsWith('[')) {
      const parsed = tryParseJson(line)
      if (parsed == null) continue
      sawParsableJson = true
      if (containsToolEvent(parsed)) return true
    }
  }

  // If this chunk contains parsable JSON and none had tool events, return false.
  // If this chunk is partial/unparseable, we intentionally return false to avoid false positives.
  return sawParsableJson ? false : false
}

async function bufferResponse(
  response: Response,
): Promise<{ text: string; toolDetected: boolean }> {
  if (response.body == null) {
    return { text: '', toolDetected: false }
  }
  const text = await response.text()
  return { text, toolDetected: inspectToolMarker(text) }
}

function detectFakeRenderLayoutJson(text: string): boolean {
  const max = 200_000
  const trimmed = text.trim()
  const input = trimmed.length > max ? trimmed.slice(0, max) : trimmed

  function tryParse(candidate: string): unknown | null {
    try {
      return JSON.parse(candidate) as unknown
    } catch {
      return null
    }
  }

  function looksLikeRenderLayout(value: unknown): boolean {
    const parsed = renderLayoutSchema.safeParse(value)
    return parsed.success
  }

  // Prefer fenced JSON blocks: ```json ... ```
  const fenceRegex = /```json\s*([\s\S]*?)\s*```/g
  for (const match of input.matchAll(fenceRegex)) {
    const candidate = match[1]
    if (typeof candidate !== 'string' || candidate.trim().length === 0) continue
    const parsed = tryParse(candidate.trim())
    if (parsed != null && looksLikeRenderLayout(parsed)) return true
  }

  // Whole-body JSON
  if (input.startsWith('{') || input.startsWith('[')) {
    const parsed = tryParse(input)
    if (parsed != null && looksLikeRenderLayout(parsed)) return true
  }

  // Best-effort extraction of a JSON object substring.
  const firstBrace = input.indexOf('{')
  const lastBrace = input.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = input.slice(firstBrace, lastBrace + 1)
    const parsed = tryParse(candidate)
    if (parsed != null && looksLikeRenderLayout(parsed)) return true
  }

  return false
}

function cloneResponseFromText(source: Response, text: string): Response {
  return new Response(text, {
    status: source.status,
    statusText: source.statusText,
    headers: source.headers,
  })
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
          writeAgentLog({
            event: 'contract_violation',
            ...base,
          })
        } else {
          writeAgentLog({
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
  const userId = request.headers.get('x-user-id') ?? 'anonymous'
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const rawBody = (await request.json()) as Record<string, unknown>

  const useChatParsed = useChatBodySchema.safeParse(rawBody)
  let userMessage: string
  let currentRoute: string
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>> | undefined

  if (!useChatParsed.success || useChatParsed.data.messages.length === 0) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  userMessage = getLastUserMessage(
    useChatParsed.data.messages as Array<Record<string, unknown>>,
  )
  currentRoute = (request.headers.get('x-current-route') as string) ?? '/'
  try {
    modelMessages = await convertToModelMessages(
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

  const canonicalRole = await resolveRoleFromSessionOrHeader(request)
  const contextHeaders = new Headers(request.headers)
  contextHeaders.set('x-user-role', canonicalRole)

  const context = await buildAgentContext({
    headers: contextHeaders,
    userMessage,
    conversationHistory: '',
    currentRoute,
  })

  const isLayoutIntent = detectLayoutIntent(userMessage)
  const runResult =
    modelMessages != null && modelMessages.length > 0
      ? await novaAgent.stream({
          messages: modelMessages,
          options: context,
          forceRenderLayout: isLayoutIntent,
        })
      : await novaAgent.stream({
          prompt: userMessage,
          options: context,
          forceRenderLayout: isLayoutIntent,
        })

  if (runResult == null || typeof runResult !== 'object') {
    return NextResponse.json({ error: 'Agent stream unavailable' }, { status: 500 })
  }

  const toUIMessageStreamResponse = (
    runResult as { toUIMessageStreamResponse?: () => Response }
  ).toUIMessageStreamResponse
  if (typeof toUIMessageStreamResponse === 'function') {
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

    const shouldEnforceToolRetry =
      isLayoutIntent || context.uiContract?.requiresTool === true
    if (!shouldEnforceToolRetry) {
      return wrapped
    }

    const buffered = await bufferResponse(wrapped)
    if (buffered.toolDetected) {
      return cloneResponseFromText(wrapped, buffered.text)
    }

    const fakeJsonDetected = detectFakeRenderLayoutJson(buffered.text)
    if (fakeJsonDetected) {
      writeAgentLog({
        event: 'fake_json_render_layout_text_detected',
        role: context.userRole,
        tenantId: context.tenantId,
        productDomain: context.productDomain,
      })
    }

    writeAgentLog({
      event: 'layout_intent_missing_tool_retry',
      role: context.userRole,
      tenantId: context.tenantId,
      productDomain: context.productDomain,
    })

    const retryRunResult =
      modelMessages != null && modelMessages.length > 0
        ? await novaAgent.stream({
            messages: modelMessages,
            options: context,
            forceRenderLayout: true,
            forceRenderLayoutRetry: true,
          })
        : await novaAgent.stream({
            prompt: userMessage,
            options: context,
            forceRenderLayout: true,
            forceRenderLayoutRetry: true,
          })

    const retryToUIMessageStreamResponse = (
      retryRunResult as { toUIMessageStreamResponse?: () => Response }
    ).toUIMessageStreamResponse
    if (typeof retryToUIMessageStreamResponse !== 'function') {
      return NextResponse.json(
        { error: 'Agent stream format unsupported' },
        { status: 500 },
      )
    }

    const retryStreamResponse = retryToUIMessageStreamResponse.call(retryRunResult)
    const retryWrapped = wrapResponseWithContractLogging(retryStreamResponse, {
      requiresTool: true,
      intent: context.uiContract?.intent ?? 'informational_qna',
      role: context.userRole,
      tenantId: context.tenantId,
      productDomain: context.productDomain,
      warnMode,
      dayIndex,
    })
    const retryBuffered = await bufferResponse(retryWrapped)
    if (retryBuffered.toolDetected) {
      return cloneResponseFromText(retryWrapped, retryBuffered.text)
    }

    writeAgentLog({
      event: 'missing_tool_call_retry_failed',
      role: context.userRole,
      tenantId: context.tenantId,
      productDomain: context.productDomain,
    })

    return cloneResponseFromText(wrapped, buffered.text)
  }

  return NextResponse.json({ error: 'Agent stream format unsupported' }, { status: 500 })
}
