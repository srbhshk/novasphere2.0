import { ADAPTER_TYPE, AGENT_STATUS } from './agent.types'
import type { AdapterType, AgentStatus } from './agent.types'
import { AgentCapabilityError } from './agent.errors'
import type { AgentAdapter } from './adapter.interface'
import { ClaudeAdapter } from './adapters/claude.adapter'
import { MockAdapter } from './adapters/mock.adapter'
import { OllamaAdapter } from './adapters/ollama.adapter'
import { OpenAIAdapter } from './adapters/openai.adapter'

export type AdapterFactoryConfig = {
  type: 'auto' | AdapterType
  ollamaUrl?: string
  ollamaModel?: string
  anthropicKey?: string
  openaiKey?: string
  onStatusChange?: (status: AgentStatus) => void
}

export function isServerSide(): boolean {
  return !('window' in globalThis)
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> => {
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), timeoutMs)
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        abort.signal.addEventListener('abort', () =>
          reject(new AgentCapabilityError(`${label} timed out`)),
        )
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

export async function createAdapter(config: AdapterFactoryConfig): Promise<AgentAdapter> {
  const onStatusChange = config.onStatusChange

  if (config.type === ADAPTER_TYPE.mock) {
    return new MockAdapter(onStatusChange ? { onStatusChange } : {})
  }

  if (config.type === ADAPTER_TYPE.ollama) {
    return new OllamaAdapter({
      baseUrl: config.ollamaUrl ?? 'http://localhost:11434',
      model: config.ollamaModel ?? 'qwen2.5:0.5b',
      timeoutMs: 30_000,
      ...(onStatusChange ? { onStatusChange } : {}),
    })
  }

  if (config.type === ADAPTER_TYPE.claude) {
    const base = config.anthropicKey ? { apiKey: config.anthropicKey } : {}
    return new ClaudeAdapter({ ...base, ...(onStatusChange ? { onStatusChange } : {}) })
  }

  if (config.type === ADAPTER_TYPE.openai) {
    const base = config.openaiKey ? { apiKey: config.openaiKey } : {}
    return new OpenAIAdapter({ ...base, ...(onStatusChange ? { onStatusChange } : {}) })
  }

  const onStatusChangeAuto = config.onStatusChange
  onStatusChangeAuto?.(AGENT_STATUS.checking)

  const ollama = new OllamaAdapter({
    baseUrl: config.ollamaUrl ?? 'http://localhost:11434',
    model: config.ollamaModel ?? 'qwen2.5:0.5b',
    timeoutMs: 30_000,
    ...(onStatusChangeAuto ? { onStatusChange: onStatusChangeAuto } : {}),
  })

  try {
    await withTimeout(ollama.init(), 2000, 'OllamaAdapter.init()')
    onStatusChangeAuto?.(AGENT_STATUS.idle)
    return ollama
  } catch (err) {
    process.emitWarning('[novasphere] Ollama unreachable; falling back to MockAdapter', {
      code: 'NOVASPHERE_OLLAMA_UNREACHABLE',
      detail: err instanceof Error ? err.message : String(err),
    })
    return new MockAdapter(
      onStatusChangeAuto ? { onStatusChange: onStatusChangeAuto } : {},
    )
  }
}
