import type {
  SparklineDataPoint,
  DonutSegment,
  AreaDataPoint,
  HeatmapCell,
} from '@novasphere/ui-charts'

export const MOCK_MRR = {
  value: 847_500,
  trend: 12.3,
  deltaDirection: 'up' as const,
}

export const MOCK_CHURN = {
  value: 7.8,
  trend: 4.2,
  deltaDirection: 'up' as const,
  // Used to trigger the automatic anomaly explanation flow.
  anomaly: true as const,
}

export const MOCK_ACTIVE_USERS = {
  value: 12_847,
  trend: 8.7,
  deltaDirection: 'up' as const,
}

export const MOCK_REVENUE_HISTORY: AreaDataPoint[] = [
  { label: 'Oct', value: 720_000 },
  { label: 'Nov', value: 758_000 },
  { label: 'Dec', value: 791_000 },
  { label: 'Jan', value: 812_000 },
  { label: 'Feb', value: 834_000 },
  { label: 'Mar', value: 847_500 },
]

export const MOCK_PIPELINE_STAGES: DonutSegment[] = [
  { id: 'discovery', label: 'Discovery', value: 24 },
  { id: 'proposal', label: 'Proposal', value: 18 },
  { id: 'negotiation', label: 'Negotiation', value: 12 },
  { id: 'closed', label: 'Closed', value: 46 },
]

function generateHeatmapData(): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const days: HeatmapCell['day'][] = [0, 1, 2, 3, 4, 5, 6]
  for (let week = 0; week < 12; week++) {
    for (const day of days) {
      cells.push({
        week,
        day,
        value: Math.floor(Math.random() * 100),
      })
    }
  }
  return cells
}

export const MOCK_ACTIVITY_HEATMAP = generateHeatmapData()

export const MOCK_SPARKLINE_DATA: SparklineDataPoint[] = [
  { value: 72 },
  { value: 68 },
  { value: 75 },
  { value: 71 },
  { value: 78 },
  { value: 74 },
  { value: 80 },
]
