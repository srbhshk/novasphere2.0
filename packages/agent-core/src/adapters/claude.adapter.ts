import { AGENT_STATUS } from '../agent.types'
import type { AgentMessage, AgentResponse, AgentStatus } from '../agent.types'
import { AgentCapabilityError } from '../agent.errors'
import type { AgentAdapter, AdapterChatParams, OnToken } from '../adapter.interface'

type ClaudeAdapterConfig = {
  apiKey?: string
  onStatusChange?: (status: AgentStatus) => void
}

const now = (): number => Date.now()
const createId = (): string => `${now()}-${Math.random().toString(16).slice(2)}`

const isServerSide = (): boolean => !('window' in globalThis)

const requireAnthropic = (): unknown => {
  return require('@anthropic-ai/sdk')
}

type AnthropicClient = {
  messages: {
    create: (args: unknown) => Promise<unknown>
    stream?: (args: unknown) => AsyncIterable<unknown>
  }
}

const isAnthropicClient = (v: unknown): v is AnthropicClient => {
  if (!v || typeof v !== 'object') return false
  const messages = (v as { messages?: unknown }).messages
  if (!messages || typeof messages !== 'object') return false
  const create = (messages as { create?: unknown }).create
  return typeof create === 'function'
}

type AnthropicMessageResult = {
  content: Array<{ type: string; text?: string }>
}

type AnthropicStreamEvent =
  | { type: 'content_block_delta'; delta?: { text?: string } }
  | { type: string; delta?: { text?: string } }

export class ClaudeAdapter implements AgentAdapter {
  public readonly type = 'claude' as const
  public readonly modelName: string

  private status: AgentStatus = AGENT_STATUS.idle
  private readonly apiKey: string | undefined
  private readonly onStatusChange: ((status: AgentStatus) => void) | undefined
  private client: AnthropicClient | null = null

  public constructor(config: ClaudeAdapterConfig) {
    this.apiKey = config.apiKey
    this.onStatusChange = config.onStatusChange
    this.modelName = 'claude'
  }

  private setStatus(next: AgentStatus): void {
    this.status = next
    this.onStatusChange?.(next)
  }

  public getStatus(): AgentStatus {
    return this.status
  }

  public async init(): Promise<void> {
    if (!isServerSide()) {
      throw new AgentCapabilityError('ClaudeAdapter can only run server-side.')
    }
    if (!this.apiKey) {
      throw new AgentCapabilityError('Missing ANTHROPIC API key.')
    }

    const mod = requireAnthropic()
    const Ctor = (mod as { default?: unknown }).default ?? mod
    if (typeof Ctor !== 'function') {
      throw new AgentCapabilityError('Anthropic SDK constructor not found.')
    }

    const instance = new (Ctor as new (...args: unknown[]) => unknown)({
      apiKey: this.apiKey,
    })
    if (!isAnthropicClient(instance)) {
      throw new AgentCapabilityError('Anthropic SDK client shape not recognized.')
    }
    this.client = instance
    this.setStatus(AGENT_STATUS.idle)
  }

  public async chat(params: AdapterChatParams): Promise<AgentResponse> {
    if (!this.client) throw new AgentCapabilityError('ClaudeAdapter not initialized.')
    this.setStatus(AGENT_STATUS.thinking)

    const system = params.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')

    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    const result = (await this.client.messages.create({
      model: this.modelName,
      system,
      max_tokens: 1024,
      messages,
      stream: false,
    })) as unknown

    const parsed = result as AnthropicMessageResult
    const text =
      parsed.content?.map((c) => (typeof c.text === 'string' ? c.text : '')).join('') ??
      ''
    if (text.length === 0) {
      throw new AgentCapabilityError('Anthropic response contained no text content.')
    }

    const message: AgentMessage = {
      id: createId(),
      role: 'assistant',
      content: text,
      timestamp: now(),
    }
    this.setStatus(AGENT_STATUS.idle)
    return { message, toolCalls: [], isStreaming: false, done: true }
  }

  public async streamChat(
    params: AdapterChatParams,
    onToken: OnToken,
  ): Promise<AgentResponse> {
    if (!this.client) throw new AgentCapabilityError('ClaudeAdapter not initialized.')
    this.setStatus(AGENT_STATUS.streaming)

    const streamFn = this.client.messages.stream
    if (!streamFn) {
      throw new AgentCapabilityError('Anthropic SDK streaming is not available.')
    }

    const system = params.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')

    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    const stream = streamFn({
      model: this.modelName,
      system,
      max_tokens: 1024,
      messages,
      stream: true,
    })

    let out = ''
    for await (const evt of stream as AsyncIterable<unknown>) {
      const e = evt as AnthropicStreamEvent
      if (e.type === 'content_block_delta') {
        const token = e.delta?.text
        if (typeof token === 'string' && token.length > 0) {
          out += token
          onToken(token)
        }
      }
    }

    const message: AgentMessage = {
      id: createId(),
      role: 'assistant',
      content: out,
      timestamp: now(),
    }
    this.setStatus(AGENT_STATUS.idle)
    return { message, toolCalls: [], isStreaming: true, done: true }
  }

  public async destroy(): Promise<void> {
    this.client = null
    this.setStatus(AGENT_STATUS.idle)
  }
}
