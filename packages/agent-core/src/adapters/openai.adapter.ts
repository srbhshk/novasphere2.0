import { AGENT_STATUS } from '../agent.types'
import type { AgentMessage, AgentResponse, AgentStatus } from '../agent.types'
import { AgentCapabilityError } from '../agent.errors'
import type { AgentAdapter, AdapterChatParams, OnToken } from '../adapter.interface'

type OpenAIAdapterConfig = {
  apiKey?: string
  baseUrl?: string
  onStatusChange?: (status: AgentStatus) => void
}

type OpenAIChatCompletion = {
  choices: Array<{ message?: { content?: string } }>
}

type OpenAIStreamChunk = {
  choices: Array<{ delta?: { content?: string } }>
}

const now = (): number => Date.now()
const createId = (): string => `${now()}-${Math.random().toString(16).slice(2)}`

const isServerSide = (): boolean => !('window' in globalThis)

const toOpenAIMessages = (
  messages: AgentMessage[],
): Array<{ role: string; content: string }> => {
  return messages.map((m) => ({ role: m.role, content: m.content }))
}

const requireOpenAI = (): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('openai')
}

type OpenAIClient = {
  chat: {
    completions: {
      create: (args: unknown) => Promise<unknown> | AsyncIterable<unknown>
    }
  }
}

const isOpenAIClient = (v: unknown): v is OpenAIClient => {
  if (!v || typeof v !== 'object') return false
  const chat = (v as { chat?: unknown }).chat
  if (!chat || typeof chat !== 'object') return false
  const completions = (chat as { completions?: unknown }).completions
  if (!completions || typeof completions !== 'object') return false
  const create = (completions as { create?: unknown }).create
  return typeof create === 'function'
}

export class OpenAIAdapter implements AgentAdapter {
  public readonly type = 'openai' as const
  public readonly modelName: string

  private status: AgentStatus = AGENT_STATUS.idle
  private readonly apiKey: string | undefined
  private readonly baseUrl: string | undefined
  private readonly onStatusChange: ((status: AgentStatus) => void) | undefined
  private client: OpenAIClient | null = null

  public constructor(config: OpenAIAdapterConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.onStatusChange = config.onStatusChange
    this.modelName = 'gpt'
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
      throw new AgentCapabilityError('OpenAIAdapter can only run server-side.')
    }
    if (!this.apiKey) {
      throw new AgentCapabilityError('Missing OPENAI API key.')
    }

    const mod = requireOpenAI()
    const Ctor = (mod as { default?: unknown }).default ?? mod
    if (typeof Ctor !== 'function') {
      throw new AgentCapabilityError('OpenAI SDK constructor not found.')
    }

    const instance = new (Ctor as new (...args: unknown[]) => unknown)({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    })

    if (!isOpenAIClient(instance)) {
      throw new AgentCapabilityError('OpenAI SDK client shape not recognized.')
    }

    this.client = instance
    this.setStatus(AGENT_STATUS.idle)
  }

  public async chat(params: AdapterChatParams): Promise<AgentResponse> {
    if (!this.client) throw new AgentCapabilityError('OpenAIAdapter not initialized.')
    this.setStatus(AGENT_STATUS.thinking)

    const result = (await this.client.chat.completions.create({
      model: this.modelName,
      messages: toOpenAIMessages(params.messages),
      stream: false,
    })) as unknown

    const parsed = result as OpenAIChatCompletion
    const content = parsed.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new AgentCapabilityError('OpenAI chat response missing content.')
    }

    const message: AgentMessage = {
      id: createId(),
      role: 'assistant',
      content,
      timestamp: now(),
    }
    this.setStatus(AGENT_STATUS.idle)
    return { message, toolCalls: [], isStreaming: false, done: true }
  }

  public async streamChat(
    params: AdapterChatParams,
    onToken: OnToken,
  ): Promise<AgentResponse> {
    if (!this.client) throw new AgentCapabilityError('OpenAIAdapter not initialized.')
    this.setStatus(AGENT_STATUS.streaming)

    const stream = this.client.chat.completions.create({
      model: this.modelName,
      messages: toOpenAIMessages(params.messages),
      stream: true,
    })

    if (!(Symbol.asyncIterator in (stream as object))) {
      throw new AgentCapabilityError(
        'OpenAI SDK did not return an async iterable for streaming.',
      )
    }

    let out = ''
    for await (const chunk of stream as AsyncIterable<unknown>) {
      const parsed = chunk as OpenAIStreamChunk
      const token = parsed.choices?.[0]?.delta?.content
      if (typeof token === 'string' && token.length > 0) {
        out += token
        onToken(token)
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
