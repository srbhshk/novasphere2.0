import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BarDataPoint, ChartVariant } from '../chart.types'
import { ChartResponsiveContainer } from '../ChartResponsiveContainer/ChartResponsiveContainer'
import { ChartSkeleton } from '../ChartSkeleton/ChartSkeleton'
import { ChartEmpty } from '../ChartEmpty/ChartEmpty'

// Recharts cannot resolve CSS custom properties at runtime — use token hex values.
const CHART_COLORS = [
  '#38bdf8',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#e11d48',
  '#facc15',
  '#6366f1',
]
const getChartColor = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0] ?? '#38bdf8'

export type BarChartProps = {
  data: BarDataPoint[]
  loading?: boolean
  height?: number
  variant?: ChartVariant
  orientation?: 'horizontal' | 'vertical'
  showValues?: boolean
}

export function BarChart({
  data,
  loading = false,
  height = 220,
  variant = 'default',
  orientation = 'vertical',
  showValues = false,
}: BarChartProps) {
  if (loading) {
    return <ChartSkeleton height={height} variant={variant} />
  }

  if (data.length === 0) {
    return <ChartEmpty height={height} variant={variant} />
  }

  const tooltipStyle = {
    borderRadius: 8,
    border: '1px solid var(--ns-color-border)',
    backgroundColor: 'var(--ns-color-surface)',
    color: 'var(--ns-color-text)',
  }

  if (orientation === 'horizontal') {
    return (
      <ChartResponsiveContainer height={height} className="min-h-0 w-full min-w-0">
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: showValues ? 40 : 8, top: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--ns-color-border-subtle)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--ns-color-muted)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--ns-color-muted)', fontSize: 10 }}
            width={90}
          />
          <RechartsTooltip
            cursor={{ fill: 'var(--ns-color-surface-muted)' }}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell
                key={`bar-${entry.label}-${index}`}
                fill={entry.color ?? getChartColor(index)}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ChartResponsiveContainer>
    )
  }

  return (
    <ChartResponsiveContainer height={height} className="min-h-0 w-full min-w-0">
      <RechartsBarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--ns-color-muted)', fontSize: 10 }}
        />
        <RechartsTooltip
          cursor={{ fill: 'var(--ns-color-surface-muted)' }}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={`bar-${entry.label}-${index}`}
              fill={entry.color ?? getChartColor(index)}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ChartResponsiveContainer>
  )
}
