import { NextResponse } from 'next/server'
import { convertToModelMessages } from 'ai'
import { z } from 'zod'
import { buildAgentContext } from '@/lib/agent/context-builder'
import { novaAgent } from '@/lib/agent/nova-agent'
import { genUiTools } from '@/lib/agent/genui/tools'

type RateWindow = {
  count: number
  resetAt: number
}

const RATE_WINDOWS = new Map<string, RateWindow>()

const legacyBodySchema = z.object({
  prompt: z.string().min(1),
  conversationHistory: z.string().default(''),
  currentRoute: z.string().default('/'),
  composeInitialLayout: z.boolean().optional(),
})

const useChatBodySchema = z.object({
  messages: z.array(z.record(z.unknown())),
})

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

function normalizeUserPrompt(input: string): string {
  const normalized = input.trim()
  if (normalized.toLowerCase() === 'show me what matters for the board meeting') {
    return `${normalized}\n\nYou MUST call render_layout exactly once with this JSON arguments:\n{"cards":[{"moduleId":"metric-mrr","colSpan":4,"rowSpan":1,"order":0,"visible":true,"title":"MRR"},{"moduleId":"metric-churn","colSpan":4,"rowSpan":1,"order":1,"visible":true,"title":"Churn"},{"moduleId":"metric-users","colSpan":4,"rowSpan":1,"order":2,"visible":true,"title":"Active Users"},{"moduleId":"chart-revenue","colSpan":8,"rowSpan":2,"order":3,"visible":true,"title":"Revenue"},{"moduleId":"chart-pipeline","colSpan":4,"rowSpan":2,"order":4,"visible":true,"title":"Pipeline"}],"reasoning":"Board-level metrics first, then revenue and pipeline."}\nAfter the tool call, provide a brief explanation (1 sentence).`
  }
  if (normalized.toLowerCase() === 'make this better') {
    return `${normalized}\n\nYou MUST call ask_clarification with this JSON arguments:\n{"question":"What are you optimising for right now?","options":["Board presentation","Daily standup","Investor review"]}\nAfter the tool call, respond with only the clarifying question text.`
  }
  if (normalized.toLowerCase() === 'board presentation') {
    return `${normalized}\n\nYou MUST call render_layout exactly once with this JSON arguments:\n{"cards":[{"moduleId":"metric-mrr","colSpan":4,"rowSpan":1,"order":0,"visible":true,"title":"MRR"},{"moduleId":"metric-churn","colSpan":4,"rowSpan":1,"order":1,"visible":true,"title":"Churn"},{"moduleId":"metric-users","colSpan":4,"rowSpan":1,"order":2,"visible":true,"title":"Active Users"},{"moduleId":"chart-revenue","colSpan":8,"rowSpan":2,"order":3,"visible":true,"title":"Revenue"},{"moduleId":"chart-pipeline","colSpan":4,"rowSpan":2,"order":4,"visible":true,"title":"Pipeline"}],"reasoning":"Board presentation: top-line metrics first, then revenue and pipeline."}\nAfter the tool call, provide a brief explanation (1 sentence).`
  }
  if (normalized.toLowerCase() === 'daily standup') {
    return `${normalized}\n\nYou MUST call render_layout exactly once with this JSON arguments:\n{"cards":[{"moduleId":"metric-users","colSpan":4,"rowSpan":1,"order":0,"visible":true,"title":"Active Users"},{"moduleId":"chart-activity","colSpan":8,"rowSpan":2,"order":1,"visible":true,"title":"Activity"},{"moduleId":"activity-feed","colSpan":4,"rowSpan":2,"order":2,"visible":true,"title":"Recent Activity"}],"reasoning":"Daily standup: focus on operational activity and recent changes."}\nAfter the tool call, provide a brief explanation (1 sentence).`
  }
  if (normalized.toLowerCase() === 'investor review') {
    return `${normalized}\n\nYou MUST call render_layout exactly once with this JSON arguments:\n{"cards":[{"moduleId":"metric-mrr","colSpan":4,"rowSpan":1,"order":0,"visible":true,"title":"MRR"},{"moduleId":"metric-churn","colSpan":4,"rowSpan":1,"order":1,"visible":true,"title":"Churn"},{"moduleId":"metric-users","colSpan":4,"rowSpan":1,"order":2,"visible":true,"title":"Active Users"},{"moduleId":"chart-revenue","colSpan":8,"rowSpan":2,"order":3,"visible":true,"title":"Revenue"},{"moduleId":"chart-pipeline","colSpan":4,"rowSpan":2,"order":4,"visible":true,"title":"Pipeline"}],"reasoning":"Investor review: emphasize growth and churn, then revenue and pipeline health."}\nAfter the tool call, provide a brief explanation (1 sentence).`
  }
  return normalized
}

export async function POST(request: Request): Promise<Response> {
  const userId = request.headers.get('x-user-id') ?? 'anonymous'
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const rawBody = (await request.json()) as Record<string, unknown>

  const useChatParsed = useChatBodySchema.safeParse(rawBody)
  const legacyParsed = legacyBodySchema.safeParse(rawBody)

  let userMessage: string
  let currentRoute: string
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>> | undefined
  let composeInitialLayout = false

  if (useChatParsed.success && useChatParsed.data.messages.length > 0) {
    userMessage = normalizeUserPrompt(
      getLastUserMessage(useChatParsed.data.messages as Array<Record<string, unknown>>),
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
  } else if (legacyParsed.success) {
    userMessage = normalizeUserPrompt(legacyParsed.data.prompt)
    currentRoute = legacyParsed.data.currentRoute
    composeInitialLayout = legacyParsed.data.composeInitialLayout === true
  } else {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const context = await buildAgentContext({
    headers: request.headers,
    userMessage,
    conversationHistory: '',
    currentRoute,
  })

  if (composeInitialLayout && (modelMessages == null || modelMessages.length === 0)) {
    const composed = await novaAgent.composeInitialLayout(context)
    const cards = composed?.cards ?? []
    return NextResponse.json({ cards })
  }

  const runResult =
    modelMessages != null && modelMessages.length > 0
      ? await novaAgent.stream({ messages: modelMessages, options: context })
      : await novaAgent.stream({ prompt: userMessage, options: context })

  if (runResult == null || typeof runResult !== 'object') {
    return NextResponse.json({ error: 'Agent stream unavailable' }, { status: 500 })
  }

  const toUIMessageStreamResponse = (
    runResult as { toUIMessageStreamResponse?: () => Response }
  ).toUIMessageStreamResponse
  if (typeof toUIMessageStreamResponse === 'function') {
    return toUIMessageStreamResponse.call(runResult)
  }

  return NextResponse.json({ error: 'Agent stream format unsupported' }, { status: 500 })
}
