import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import type { SparklineDataPoint, ChartVariant } from '../chart.types'
import { ChartSkeleton } from '../ChartSkeleton/ChartSkeleton'
import { ChartEmpty } from '../ChartEmpty/ChartEmpty'

export type SparklineChartProps = {
  data: SparklineDataPoint[]
  loading?: boolean
  height?: number
  variant?: ChartVariant
  color?: string
}

export function SparklineChart({
  data,
  loading = false,
  height = 80,
  variant = 'default',
  color = '#38bdf8',
}: SparklineChartProps) {
  if (loading) {
    return <ChartSkeleton height={height} variant={variant} />
  }

  if (data.length === 0) {
    return <ChartEmpty height={height} variant={variant} />
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            cursor={false}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--ns-color-border)',
              backgroundColor: 'var(--ns-color-surface)',
              color: 'var(--ns-color-text)',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
