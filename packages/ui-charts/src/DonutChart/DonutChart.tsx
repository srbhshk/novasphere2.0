import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import type { DonutSegment, ChartVariant } from '../chart.types'
import { ChartSkeleton } from '../ChartSkeleton/ChartSkeleton'
import { ChartEmpty } from '../ChartEmpty/ChartEmpty'

export type DonutChartProps = {
  data: DonutSegment[]
  loading?: boolean
  height?: number
  variant?: ChartVariant
}

const DEFAULT_COLORS: string[] = ['#38bdf8', '#22c55e', '#a855f7', '#f97316', '#e11d48']

export function DonutChart({
  data,
  loading = false,
  height = 220,
  variant = 'default',
}: DonutChartProps) {
  if (loading) {
    return <ChartSkeleton height={height} variant={variant} />
  }

  if (data.length === 0) {
    return <ChartEmpty height={height} variant={variant} />
  }

  const total = data.reduce((sum, seg) => sum + seg.value, 0)

  return (
    <div style={{ height }} className="flex w-full flex-col gap-3">
      <div className="flex h-full w-full items-center justify-center">
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <RechartsTooltip
              cursor={false}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--ns-color-border)',
                backgroundColor: 'var(--ns-color-surface)',
                color: 'var(--ns-color-text)',
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`segment-${entry.id}-${index}`}
                  fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 text-xs text-[color:var(--ns-color-muted)]">
        <div className="text-[color:var(--ns-color-text)]">
          Total:{' '}
          <span className="font-semibold">
            {total.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.map((segment, index) => {
            const color = segment.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            const percentage = total === 0 ? 0 : (segment.value / total) * 100
            return (
              <div key={segment.id} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-[color:var(--ns-color-text)]">
                  {segment.label}
                </span>
                <span className="text-[color:var(--ns-color-muted)]">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
