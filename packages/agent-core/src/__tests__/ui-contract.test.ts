import { describe, expect, it } from 'vitest'
import {
  UI_CONTRACT_FALLBACK,
  UI_INTENT,
  allowedFallbackForIntent,
  classifyUiIntent,
  requiresToolForIntent,
} from '../index'

describe('ui action contract', () => {
  it('classifies layout requests as layout_change', () => {
    expect(classifyUiIntent('Keep my dashboard and prioritize urgent signals')).toBe(
      UI_INTENT.layoutChange,
    )
  })

  it('classifies empty prompts as informational_qna', () => {
    expect(classifyUiIntent('')).toBe(UI_INTENT.informationalQna)
  })

  it('classifies anomaly prompts as anomaly_explanation', () => {
    expect(classifyUiIntent('Explain this anomaly in the retention trend')).toBe(
      UI_INTENT.anomalyExplanation,
    )
  })

  it('requires tools for ui-affecting intents', () => {
    expect(requiresToolForIntent(UI_INTENT.layoutChange)).toBe(true)
    expect(requiresToolForIntent(UI_INTENT.visibilityChange)).toBe(true)
    expect(requiresToolForIntent(UI_INTENT.anomalyExplanation)).toBe(true)
    expect(requiresToolForIntent(UI_INTENT.informationalQna)).toBe(false)
  })

  it('does not allow clarification fallback', () => {
    expect(allowedFallbackForIntent(UI_INTENT.clarificationRequired)).toBe(
      UI_CONTRACT_FALLBACK.none,
    )
    expect(allowedFallbackForIntent(UI_INTENT.layoutChange)).toBe(
      UI_CONTRACT_FALLBACK.none,
    )
  })
})
