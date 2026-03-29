import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

import { env } from '@/lib/env'
import { writeAgentLogWithFileSink } from '@/lib/agent/observability-server'
import { novaConfig } from 'nova.config'

export { DEFAULT_OLLAMA_MODEL, FALLBACK_OLLAMA_MODEL } from '@/lib/agent/ollama-defaults'

let warnedSmallModel = false

/**
 * Parses the largest `…Nb` token in an Ollama model id (e.g. `qwen2.5:0.5b` → 0.5).
 * Returns undefined when no parameter size can be inferred (no warning in that case).
 */
function extractLargestParameterBillions(modelId: string): number | undefined {
  const re = /(\d+(?:\.\d+)?)b\b/gi
  let match: RegExpExecArray | null
  let max: number | undefined
  while ((match = re.exec(modelId)) !== null) {
    const n = Number.parseFloat(match[1] ?? '')
    if (!Number.isFinite(n)) continue
    if (max === undefined || n > max) max = n
  }
  return max
}

function warnIfModelTooSmallForGenUi(modelId: string): void {
  if (warnedSmallModel) return
  const billions = extractLargestParameterBillions(modelId)
  if (billions === undefined || billions >= 3) return
  warnedSmallModel = true
  writeAgentLogWithFileSink({
    level: 'warn',
    event: 'ollama_model_small',
    message: 'Model too small for GenUI — expect degraded behavior',
    modelId,
  })
}

function resolveOllamaModelId(): string {
  if (env.AI_LATENCY_PROFILE === 'responsive') {
    const fromEnv = env.OLLAMA_MODEL_FAST
    if (typeof fromEnv === 'string' && fromEnv.length > 0) {
      return fromEnv
    }
    return novaConfig.agent.ollamaModelFast
  }
  return env.OLLAMA_MODEL
}

export function createOllamaModel(): LanguageModel {
  const baseURL = `${env.OLLAMA_BASE_URL}/v1`
  const modelName = resolveOllamaModelId()

  warnIfModelTooSmallForGenUi(modelName)

  const ollama = createOpenAI({
    baseURL,
    apiKey: 'ollama',
  })

  return ollama.chat(modelName)
}

export async function createClaudeModel(): Promise<LanguageModel | null> {
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (typeof anthropicKey !== 'string' || anthropicKey.length === 0) {
    return null
  }

  const anthropicBaseUrl = process.env['ANTHROPIC_BASE_URL']
  const anthropicCompatible = createOpenAI({
    apiKey: anthropicKey,
    ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
  })

  return anthropicCompatible('claude-3-5-sonnet-latest')
}

export async function createOpenAIModel(): Promise<LanguageModel | null> {
  const openaiKey = process.env['OPENAI_API_KEY']
  if (typeof openaiKey !== 'string' || openaiKey.length === 0) {
    return null
  }

  const openaiBaseUrl = process.env['OPENAI_BASE_URL']
  const openai = createOpenAI({
    apiKey: openaiKey,
    ...(openaiBaseUrl ? { baseURL: openaiBaseUrl } : {}),
  })

  return openai('gpt-4o-mini')
}

async function isOllamaReachable(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function getActiveModel(): Promise<LanguageModel> {
  if (env.AI_PROVIDER === 'claude') {
    const model = await createClaudeModel()
    if (model) return model
    throw new Error('AI_PROVIDER=claude requires ANTHROPIC_API_KEY')
  }

  if (env.AI_PROVIDER === 'openai') {
    const model = await createOpenAIModel()
    if (model) return model
    throw new Error('AI_PROVIDER=openai requires OPENAI_API_KEY')
  }

  if (env.AI_PROVIDER === 'ollama') {
    return createOllamaModel()
  }

  const claudeModel = await createClaudeModel()
  if (claudeModel) {
    return claudeModel
  }

  const openaiModel = await createOpenAIModel()
  if (openaiModel) {
    return openaiModel
  }

  if (!(await isOllamaReachable())) {
    throw new Error(
      'No AI provider available: set ANTHROPIC_API_KEY or OPENAI_API_KEY, or start Ollama.',
    )
  }

  return createOllamaModel()
}
