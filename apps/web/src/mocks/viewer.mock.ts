import type { ViewerMetricsResponse } from './mock.types'
import { buildMonthLabels, buildSparkline } from './shared.mock'

const MONTH_LABELS = buildMonthLabels(12)

const REVENUE_HISTORY = MONTH_LABELS.map((label, i) => ({
  label,
  value: Math.round(720_000 + i * 11_500),
}))

export const VIEWER_METRICS: ViewerMetricsResponse = {
  kpis: [
    {
      id: 'mrr',
      label: 'MRR',
      value: 847_500,
      trend: 12.3,
      deltaDirection: 'up',
      unit: 'currency',
      sparkline: buildSparkline(847_500, 7, 0.04, 10),
      prefix: '$',
    },
    {
      id: 'active-users',
      label: 'Active Users',
      value: 12_847,
      trend: 8.7,
      deltaDirection: 'up',
      unit: 'count',
      sparkline: buildSparkline(12_847, 7, 0.04, 20),
    },
  ],
  revenueHistory: REVENUE_HISTORY,
  pipelineByStage: [
    { id: 'discovery', label: 'Discovery', value: 24 },
    { id: 'qualification', label: 'Qualification', value: 18 },
    { id: 'proposal', label: 'Proposal', value: 14 },
    { id: 'negotiation', label: 'Negotiation', value: 12 },
    { id: 'closed-won', label: 'Closed Won', value: 32 },
  ],
}
