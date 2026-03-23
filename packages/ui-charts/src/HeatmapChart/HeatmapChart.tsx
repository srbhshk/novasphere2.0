import type { CSSProperties } from 'react'
import { GlassCard } from '@novasphere/ui-glass'
import type { HeatmapCell, ChartVariant } from '../chart.types'

export type HeatmapChartProps = {
  data: HeatmapCell[]
  loading?: boolean
  height?: number
  variant?: ChartVariant
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function HeatmapChart({
  data,
  loading = false,
  height = 180,
  variant = 'default',
}: HeatmapChartProps) {
  if (loading) {
    return (
      <div
        style={{ height }}
        className="w-full animate-pulse rounded-xl bg-[color:var(--ns-color-surface-muted)]"
      />
    )
  }

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center rounded-xl border border-[color:var(--ns-color-border-subtle)] bg-[color:var(--ns-color-surface-muted)] text-xs text-[color:var(--ns-color-muted)]"
      >
        No activity yet
      </div>
    )
  }

  const weeks = Array.from(new Set(data.map((cell) => cell.week))).sort((a, b) => a - b)

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `auto repeat(${weeks.length}, minmax(0, 1fr))`,
    gap: 4,
  }

  const radiusClass =
    variant === 'compact'
      ? 'rounded-md'
      : variant === 'minimal'
        ? 'rounded-lg'
        : 'rounded-xl'

  return (
    <GlassCard variant="subtle" className={`w-full ${radiusClass}`}>
      <div style={{ height }} className="flex items-center justify-center px-3 py-2">
        <div
          style={gridStyle}
          className="w-full text-[10px] text-[color:var(--ns-color-muted)]"
        >
          <div />
          {weeks.map((week) => (
            <div key={week} className="text-center">
              {week + 1}
            </div>
          ))}
          {DAYS.map((dayLabel, dayIndex) => (
            <div key={dayLabel} className="contents">
              <div className="flex items-center">{dayLabel}</div>
              {weeks.map((week) => {
                const cell = data.find((c) => c.week === week && c.day === dayIndex)
                const value = cell?.value ?? 0
                const intensity = Math.min(1, Math.max(0, value / 100))
                const bg = `rgba(56, 189, 248, ${0.1 + intensity * 0.7})`

                return (
                  <div
                    key={`${week}-${dayIndex}`}
                    className="h-4 w-full rounded-[3px]"
                    style={{
                      backgroundColor: bg,
                    }}
                    aria-label={cell ? `${value}` : '0'}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
