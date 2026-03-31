'use client'

import { AlertTriangle } from 'lucide-react'
import type { BentoCardModuleProps } from '@novasphere/ui-bento'
import { ModuleWrapper } from './ModuleWrapper'

export function AnomalyBannerModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const rawConfig = config.config
  const signals =
    rawConfig != null && Array.isArray(rawConfig['signals'])
      ? rawConfig['signals'].filter((s): s is string => typeof s === 'string')
      : []
  const hypothesis =
    rawConfig != null && typeof rawConfig['hypothesis'] === 'string'
      ? rawConfig['hypothesis']
      : null
  const confidence =
    rawConfig != null && typeof rawConfig['confidence'] === 'string'
      ? rawConfig['confidence']
      : null

  const hasExplanation = signals.length > 0 && hypothesis != null && confidence != null
  const hasSignalsOnly = signals.length > 0 && !hasExplanation

  const confidenceColor =
    confidence === 'high'
      ? 'text-[var(--ns-color-error)]'
      : confidence === 'medium'
        ? 'text-[var(--ns-color-warning)]'
        : 'text-[var(--ns-color-muted)]'

  const wrapperTitle = config.title ? undefined : 'Anomaly Signal'

  return (
    <ModuleWrapper title={wrapperTitle}>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--ns-color-warning)]" />
          <span className="text-xs font-medium text-[var(--ns-color-warning)]">
            Signal Detected
          </span>
        </div>
        {hasExplanation ? (
          <>
            <div>
              <div className="mb-1 text-xs tracking-wide text-[var(--ns-color-muted)] uppercase">
                Signals
              </div>
              <div className="text-sm text-[var(--ns-color-text)]">
                {signals.join(', ')}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs tracking-wide text-[var(--ns-color-muted)] uppercase">
                Hypothesis
              </div>
              <div className="text-sm text-[var(--ns-color-text)]">{hypothesis}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs tracking-wide text-[var(--ns-color-muted)] uppercase">
                Confidence
              </div>
              <span className={`text-sm font-semibold capitalize ${confidenceColor}`}>
                {confidence}
              </span>
            </div>
          </>
        ) : (
          <div className="text-sm text-[var(--ns-color-text)]">
            {hasSignalsOnly ? (
              <>
                A signal was detected in:{' '}
                <span className="font-medium">{signals.join(', ')}</span>. Open Copilot to
                review cross-signal context and recommended next actions.
              </>
            ) : (
              <>
                A signal was detected. Open Copilot to review context and recommended next
                actions.
              </>
            )}
          </div>
        )}
      </div>
    </ModuleWrapper>
  )
}
