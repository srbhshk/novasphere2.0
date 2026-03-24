/**
 * Shared types for the role-scoped mock data layer.
 * All API routes and hooks use these shapes.
 */

export type KpiUnit = 'currency' | 'percent' | 'count' | 'ms'

export type DeltaDirection = 'up' | 'down' | 'flat'

export type KpiMetric = {
  id: string
  label: string
  value: number
  trend: number
  deltaDirection: DeltaDirection
  unit: KpiUnit
  sparkline?: number[]
  anomaly?: boolean
  comparisonValue?: number
  comparisonLabel?: string
  suffix?: string
  prefix?: string
}

export type RevenueDataPoint = {
  label: string
  value: number
  value2?: number
}

export type DonutDataPoint = {
  id: string
  label: string
  value: number
}

export type SparklinePoint = {
  value: number
  label?: string
}

export type HeatmapDataPoint = {
  week: number
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6
  value: number
}

export type BarDataPoint = {
  label: string
  value: number
  color?: string
}

// --- Domain types ---

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical'
export type CustomerPlan = 'free' | 'pro' | 'enterprise'

export type CustomerRow = {
  id: string
  name: string
  plan: CustomerPlan
  mrr: number
  churnRisk: ChurnRisk
  lastActive: string
  arpu: number
  seat: number
}

export type PipelineDealStage =
  | 'discovery'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost'

export type PipelineDeal = {
  id: string
  company: string
  value: number
  stage: PipelineDealStage
  owner: string
  expectedClose: string
  probability: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type ActivityEventType =
  | 'signup'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'churn'
  | 'login'
  | 'support_ticket'
  | 'config_change'
  | 'api_key_created'
  | 'deployment'
  | 'incident'
  | 'alert'
  | 'error_spike'

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
  actor?: string
  meta?: Record<string, string>
}

export type DeploymentStatus = 'success' | 'failed' | 'in_progress' | 'rolled_back'

export type Deployment = {
  id: string
  version: string
  commit: string
  commitMessage: string
  author: string
  environment: 'production' | 'staging'
  status: DeploymentStatus
  startedAt: string
  duration: number
}

export type SystemAlert = {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  startsAt: string
  resolved: boolean
  service: string
}

export type LatencyPercentiles = {
  p50: number
  p95: number
  p99: number
}

// --- Role-scoped response shapes returned by API routes ---

export type CeoMetricsResponse = {
  kpis: KpiMetric[]
  revenueHistory: RevenueDataPoint[]
  churnTrend: SparklinePoint[]
  userGrowth: RevenueDataPoint[]
  pipelineByStage: DonutDataPoint[]
  topCustomers: CustomerRow[]
  churnRiskDistribution: DonutDataPoint[]
}

export type EngineerMetricsResponse = {
  kpis: KpiMetric[]
  responseTimeTrend: RevenueDataPoint[]
  errorBreakdown: BarDataPoint[]
  activityHeatmap: HeatmapDataPoint[]
  cpuSparkline: SparklinePoint[]
  memorySparkline: SparklinePoint[]
}

export type AdminMetricsResponse = {
  kpis: KpiMetric[]
  planDistribution: DonutDataPoint[]
  userGrowth: RevenueDataPoint[]
  featureAdoption: BarDataPoint[]
  activityHeatmap: HeatmapDataPoint[]
}

export type ViewerMetricsResponse = {
  kpis: KpiMetric[]
  revenueHistory: RevenueDataPoint[]
  pipelineByStage: DonutDataPoint[]
}

export type MetricsResponse =
  | CeoMetricsResponse
  | EngineerMetricsResponse
  | AdminMetricsResponse
  | ViewerMetricsResponse
