import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

import { env } from '@/lib/env'
import { writeAgentLog } from './observability'

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
  writeAgentLog({
    level: 'warn',
    event: 'ollama_model_small',
    message: 'Model too small for GenUI — expect degraded behavior',
    modelId,
  })
}

export function createOllamaModel(): LanguageModel {
  const baseURL = `${env.OLLAMA_BASE_URL}/v1`
  const modelName = env.OLLAMA_MODEL

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

export async function getActiveModel(): Promise<LanguageModel> {
  // Priority order required by task: Ollama -> Claude -> OpenAI.
  const ollamaModel = createOllamaModel()
  if (ollamaModel) {
    return ollamaModel
  }

  const claudeModel = await createClaudeModel()
  if (claudeModel) {
    return claudeModel
  }

  const openaiModel = await createOpenAIModel()
  if (openaiModel) {
    return openaiModel
  }

  return createOllamaModel()
}
