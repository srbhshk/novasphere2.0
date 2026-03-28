/**
 * Single source for documented Ollama model names (no `env` import — safe for client bundles).
 * Runtime selection still comes from `OLLAMA_MODEL` / `env.OLLAMA_MODEL`.
 */
/** Rules baseline: smallest default for acceptable local demo latency. */
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:0.5b' as const

/** Use when the preferred tag is unavailable in your Ollama registry. */
export const FALLBACK_OLLAMA_MODEL = 'qwen2.5:3b-instruct' as const
