export type SparklineDataPoint = {
  value: number
  label?: string
}

export type DonutSegment = {
  id: string
  label: string
  value: number
  color?: string
}

export type AreaDataPoint = {
  label: string
  value: number
  value2?: number
}

export type HeatmapCell = {
  week: number
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6
  value: number
}

export type ChartVariant = 'default' | 'minimal' | 'compact'

export type BarDataPoint = {
  label: string
  value: number
  color?: string
}
