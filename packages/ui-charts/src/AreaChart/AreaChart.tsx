import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from 'recharts'
import type { AreaDataPoint, ChartVariant } from '../chart.types'
import { ChartSkeleton } from '../ChartSkeleton/ChartSkeleton'
import { ChartEmpty } from '../ChartEmpty/ChartEmpty'

export type AreaChartProps = {
  data: AreaDataPoint[]
  loading?: boolean
  height?: number
  variant?: ChartVariant
}

export function AreaChart({
  data,
  loading = false,
  height = 240,
  variant = 'default',
}: AreaChartProps) {
  if (loading) {
    return <ChartSkeleton height={height} variant={variant} />
  }

  if (data.length === 0) {
    return <ChartEmpty height={height} variant={variant} />
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <defs>
            <linearGradient id="area-primary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="area-secondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--ns-color-border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--ns-color-muted)', fontSize: 10 }}
          />
          <RechartsTooltip
            cursor={{ stroke: 'var(--ns-color-border-subtle)', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--ns-color-border)',
              backgroundColor: 'var(--ns-color-surface)',
              color: 'var(--ns-color-text)',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#area-primary)"
            fillOpacity={1}
          />
          {data.some((point) => typeof point.value2 === 'number') ? (
            <Area
              type="monotone"
              dataKey="value2"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#area-secondary)"
              fillOpacity={1}
            />
          ) : null}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
