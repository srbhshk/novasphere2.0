import type { CSSProperties } from 'react'
import { BarChart3 } from 'lucide-react'
import type { ChartVariant } from '../chart.types'

export type ChartEmptyProps = {
  message?: string
  height?: number
  variant?: ChartVariant
}

export function ChartEmpty({
  message = 'No data available',
  height = 200,
  variant = 'default',
}: ChartEmptyProps) {
  const style: CSSProperties = {
    height,
  }

  const radiusClass =
    variant === 'compact'
      ? 'rounded-md'
      : variant === 'minimal'
        ? 'rounded-lg'
        : 'rounded-xl'

  return (
    <div
      style={style}
      className={`flex w-full items-center justify-center gap-2 border border-[color:var(--ns-color-border-subtle)] bg-[color:var(--ns-color-surface-muted)] px-4 text-[color:var(--ns-color-muted)] ${radiusClass}`}
    >
      <BarChart3 className="h-4 w-4" aria-hidden="true" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  )
}
