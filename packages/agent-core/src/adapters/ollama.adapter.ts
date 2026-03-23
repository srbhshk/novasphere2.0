import { AGENT_STATUS } from '../agent.types'
import type { AgentMessage, AgentResponse, AgentStatus } from '../agent.types'
import {
  AgentNetworkError,
  AgentNotReachableError,
  AgentParseError,
  AgentTimeoutError,
} from '../agent.errors'
import type { AgentAdapter, AdapterChatParams, OnToken } from '../adapter.interface'

type OllamaConfig = {
  baseUrl: string
  model: string
  timeoutMs: number
  onStatusChange?: (status: AgentStatus) => void
}

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenAIChatCompletionResponse = {
  choices: Array<{
    message?: { role: string; content?: string }
    delta?: { content?: string }
    finish_reason?: string | null
  }>
}

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '')

const now = (): number => Date.now()

const createId = (): string => `${now()}-${Math.random().toString(16).slice(2)}`

export class OllamaAdapter implements AgentAdapter {
  public readonly type = 'ollama' as const
  public readonly modelName: string

  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly onStatusChange: ((status: AgentStatus) => void) | undefined
  private status: AgentStatus = AGENT_STATUS.idle
  private activeAbort: AbortController | null = null

  public constructor(config: OllamaConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl)
    this.modelName = config.model
    this.timeoutMs = config.timeoutMs
    this.onStatusChange = config.onStatusChange
  }

  private setStatus(next: AgentStatus): void {
    this.status = next
    this.onStatusChange?.(next)
  }

  public getStatus(): AgentStatus {
    return this.status
  }

  public async init(): Promise<void> {
    this.setStatus(AGENT_STATUS.checking)
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), 2000)
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: abort.signal })
      if (!res.ok) {
        throw new AgentNotReachableError(
          `Ollama health check failed with HTTP ${res.status}`,
        )
      }
      this.setStatus(AGENT_STATUS.idle)
    } catch (err) {
      this.setStatus(AGENT_STATUS.error)
      throw new AgentNotReachableError('Ollama is not reachable.', { cause: err })
    } finally {
      clearTimeout(timeout)
    }
  }

  private mapMessages(messages: AgentMessage[]): OpenAIChatMessage[] {
    return messages.map((m) => ({ role: m.role, content: m.content }))
  }

  public async chat(params: AdapterChatParams): Promise<AgentResponse> {
    const controller = new AbortController()
    this.activeAbort = controller
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    this.setStatus(AGENT_STATUS.thinking)

    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          messages: this.mapMessages(params.messages),
          stream: false,
        }),
      })

      if (!res.ok) {
        throw new AgentNetworkError(`Ollama chat failed with HTTP ${res.status}`)
      }

      const data = (await res.json()) as unknown
      const parsed = data as OpenAIChatCompletionResponse
      const content = parsed.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        throw new AgentParseError('Unexpected Ollama chat response shape.')
      }

      const messageId = createId()
      const responseMessage: AgentMessage = {
        id: messageId,
        role: 'assistant',
        content,
        timestamp: now(),
      }

      this.setStatus(AGENT_STATUS.idle)
      return { message: responseMessage, toolCalls: [], isStreaming: false, done: true }
    } catch (err) {
      this.setStatus(AGENT_STATUS.error)
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AgentTimeoutError('Ollama chat request timed out.', { cause: err })
      }
      throw err instanceof Error
        ? err
        : new AgentNetworkError('Ollama chat failed.', { cause: err })
    } finally {
      clearTimeout(timeout)
      this.activeAbort = null
    }
  }

  public async streamChat(
    params: AdapterChatParams,
    onToken: OnToken,
  ): Promise<AgentResponse> {
    const controller = new AbortController()
    this.activeAbort = controller
    this.setStatus(AGENT_STATUS.streaming)

    const totalTimeout = setTimeout(() => controller.abort(), 60_000)
    const firstTokenTimeout = setTimeout(() => controller.abort(), 10_000)

    const messageId = createId()
    let fullText = ''
    let sawFirstToken = false

    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          messages: this.mapMessages(params.messages),
          stream: true,
        }),
      })

      if (!res.ok) {
        throw new AgentNetworkError(`Ollama streamChat failed with HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new AgentNetworkError('Ollama streaming response body not readable.')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      let finished = false
      while (!finished) {
        const { value, done } = await reader.read()
        if (done) {
          finished = true
          break
        }
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const payload = trimmed.slice('data:'.length).trim()
          if (payload === '[DONE]') {
            finished = true
            break
          }

          const json = JSON.parse(payload) as OpenAIChatCompletionResponse
          const token = json.choices?.[0]?.delta?.content ?? ''
          if (token.length > 0) {
            if (!sawFirstToken) {
              sawFirstToken = true
              clearTimeout(firstTokenTimeout)
            }
            fullText += token
            onToken(token)
          }
        }
      }

      const responseMessage: AgentMessage = {
        id: messageId,
        role: 'assistant',
        content: fullText,
        timestamp: now(),
      }

      this.setStatus(AGENT_STATUS.idle)
      return { message: responseMessage, toolCalls: [], isStreaming: true, done: true }
    } catch (err) {
      this.setStatus(AGENT_STATUS.error)
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AgentTimeoutError('Ollama streaming request timed out.', { cause: err })
      }
      throw err instanceof Error
        ? err
        : new AgentNetworkError('Ollama streaming failed.', { cause: err })
    } finally {
      clearTimeout(totalTimeout)
      clearTimeout(firstTokenTimeout)
      this.activeAbort = null
    }
  }

  public async destroy(): Promise<void> {
    this.activeAbort?.abort()
    this.activeAbort = null
    this.setStatus(AGENT_STATUS.idle)
  }
}
