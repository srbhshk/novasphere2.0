/**
 * Single source for documented Ollama model names (no `env` import — safe for client bundles).
 * Runtime selection still comes from `OLLAMA_MODEL` / `env.OLLAMA_MODEL`.
 */
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b-instruct' as const

/** Use when the preferred tag is unavailable in your Ollama registry. */
export const FALLBACK_OLLAMA_MODEL = 'llama3.1:8b-instruct' as const
