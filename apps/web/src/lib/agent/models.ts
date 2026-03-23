import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:0.5b'

function getEnv(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function createOllamaModel(): LanguageModel {
  const baseURL = `${getEnv('OLLAMA_BASE_URL') ?? DEFAULT_OLLAMA_BASE_URL}/v1`
  const modelName = getEnv('OLLAMA_MODEL') ?? DEFAULT_OLLAMA_MODEL

  const ollama = createOpenAI({
    baseURL,
    apiKey: 'ollama',
  })

  return ollama.chat(modelName)
}

export async function createClaudeModel(): Promise<LanguageModel | null> {
  const anthropicKey = getEnv('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return null
  }

  const anthropicBaseUrl = getEnv('ANTHROPIC_BASE_URL')
  const anthropicCompatible = createOpenAI({
    apiKey: anthropicKey,
    ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
  })

  return anthropicCompatible('claude-3-5-sonnet-latest')
}

export async function createOpenAIModel(): Promise<LanguageModel | null> {
  const openaiKey = getEnv('OPENAI_API_KEY')
  if (!openaiKey) {
    return null
  }

  const openaiBaseUrl = getEnv('OPENAI_BASE_URL')
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
