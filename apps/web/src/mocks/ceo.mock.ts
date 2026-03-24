import type {
  CeoMetricsResponse,
  CustomerRow,
  PipelineDeal,
  PipelineDealStage,
  ChurnRisk,
  CustomerPlan,
  PaginatedResponse,
} from './mock.types'
import {
  buildMonthLabels,
  buildSparkline,
  companyName,
  fullName,
  seedInt,
  seedRange,
  BASE_DATE_MS,
  isoOffset,
} from './shared.mock'

const MONTH_LABELS = buildMonthLabels(12)

// MRR growing from ~720K to 847.5K over 12 months (previous year ~640K-750K)
const REVENUE_HISTORY = MONTH_LABELS.map((label, i) => ({
  label,
  value: Math.round(720_000 + i * 11_500 + seedRange(i * 3, -4_000, 4_000)),
  value2: Math.round(620_000 + i * 10_800 + seedRange(i * 3 + 1, -3_500, 3_500)),
}))

const CHURN_TREND = buildMonthLabels(12).map((label, i) => ({
  label,
  value: parseFloat((3.8 + i * 0.34 + seedRange(i + 200, -0.3, 0.3)).toFixed(1)),
}))

const USER_GROWTH = MONTH_LABELS.map((label, i) => ({
  label,
  value: Math.round(10_000 + i * 240 + seedRange(i * 5, -100, 100)),
  value2: Math.round(8_500 + i * 210 + seedRange(i * 5 + 2, -80, 80)),
}))

const PIPELINE_BY_STAGE = [
  { id: 'discovery', label: 'Discovery', value: 24 },
  { id: 'qualification', label: 'Qualification', value: 18 },
  { id: 'proposal', label: 'Proposal', value: 14 },
  { id: 'negotiation', label: 'Negotiation', value: 12 },
  { id: 'closed-won', label: 'Closed Won', value: 32 },
]

const CHURN_RISK_DISTRIBUTION = [
  { id: 'low', label: 'Low Risk', value: 58 },
  { id: 'medium', label: 'Medium Risk', value: 24 },
  { id: 'high', label: 'High Risk', value: 13 },
  { id: 'critical', label: 'Critical', value: 5 },
]

const PLANS: CustomerPlan[] = [
  'enterprise',
  'pro',
  'enterprise',
  'pro',
  'enterprise',
  'pro',
  'pro',
  'free',
  'enterprise',
  'pro',
]
const RISKS: ChurnRisk[] = [
  'low',
  'medium',
  'low',
  'high',
  'low',
  'medium',
  'critical',
  'high',
  'low',
  'medium',
]

const TOP_CUSTOMERS: CustomerRow[] = Array.from({ length: 20 }, (_, i) => {
  const plan = PLANS[i % PLANS.length] ?? 'pro'
  const mrr = Math.round(
    seedRange(
      i * 7,
      plan === 'enterprise' ? 8_000 : 1_200,
      plan === 'enterprise' ? 22_000 : 4_000,
    ),
  )
  return {
    id: `cust-${String(i + 1).padStart(3, '0')}`,
    name: companyName(i * 11),
    plan,
    mrr,
    churnRisk: RISKS[i % RISKS.length] ?? 'low',
    lastActive: isoOffset(BASE_DATE_MS, -seedInt(i * 3, 0, 14)),
    arpu: Math.round(mrr / seedInt(i * 5, 3, 25)),
    seat: seedInt(i * 5, 3, 25),
  }
}).sort((a, b) => b.mrr - a.mrr)

const STAGES: PipelineDealStage[] = [
  'discovery',
  'qualification',
  'proposal',
  'negotiation',
  'closed-won',
]

const PIPELINE_DEALS: PipelineDeal[] = Array.from({ length: 30 }, (_, i) => {
  const stage = STAGES[i % STAGES.length] ?? 'discovery'
  const value = Math.round(seedRange(i * 9, 5_000, 120_000))
  const probability = {
    discovery: 15,
    qualification: 30,
    proposal: 55,
    negotiation: 75,
    'closed-won': 100,
    'closed-lost': 0,
  }[stage]
  return {
    id: `deal-${String(i + 1).padStart(3, '0')}`,
    company: companyName(i * 13 + 3),
    value,
    stage,
    owner: fullName(i * 17),
    expectedClose: isoOffset(BASE_DATE_MS, seedInt(i * 11, 7, 90)),
    probability,
  }
})

export const CEO_METRICS: CeoMetricsResponse = {
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
      id: 'arr',
      label: 'ARR',
      value: 10_170_000,
      trend: 12.3,
      deltaDirection: 'up',
      unit: 'currency',
      sparkline: buildSparkline(10_170_000, 7, 0.04, 20),
      prefix: '$',
    },
    {
      id: 'nrr',
      label: 'Net Revenue Retention',
      value: 112,
      trend: 2.1,
      deltaDirection: 'up',
      unit: 'percent',
      sparkline: buildSparkline(112, 7, 0.03, 30),
      suffix: '%',
    },
    {
      id: 'churn',
      label: 'Churn Rate',
      value: 7.8,
      trend: 4.2,
      deltaDirection: 'up',
      unit: 'percent',
      sparkline: buildSparkline(7.8, 7, 0.06, 40),
      anomaly: true,
      suffix: '%',
    },
    {
      id: 'arpu',
      label: 'ARPU',
      value: 66,
      trend: 3.7,
      deltaDirection: 'up',
      unit: 'currency',
      sparkline: buildSparkline(66, 7, 0.04, 50),
      prefix: '$',
    },
    {
      id: 'ltv',
      label: 'Customer LTV',
      value: 2_400,
      trend: 5.2,
      deltaDirection: 'up',
      unit: 'currency',
      sparkline: buildSparkline(2_400, 7, 0.04, 60),
      prefix: '$',
    },
    {
      id: 'conversion',
      label: 'Trial Conversion',
      value: 24,
      trend: -1.8,
      deltaDirection: 'down',
      unit: 'percent',
      sparkline: buildSparkline(24, 7, 0.06, 70),
      suffix: '%',
    },
  ],
  revenueHistory: REVENUE_HISTORY,
  churnTrend: CHURN_TREND,
  userGrowth: USER_GROWTH,
  pipelineByStage: PIPELINE_BY_STAGE,
  topCustomers: TOP_CUSTOMERS,
  churnRiskDistribution: CHURN_RISK_DISTRIBUTION,
}

export function getCeoCustomers(
  page: number,
  limit: number,
  sort: string,
  risk?: string,
): PaginatedResponse<CustomerRow> {
  let items = [...TOP_CUSTOMERS]
  if (risk && risk !== 'all') {
    items = items.filter((c) => c.churnRisk === risk)
  }
  if (sort === 'mrr') items.sort((a, b) => b.mrr - a.mrr)
  else if (sort === 'risk') {
    const riskOrder: Record<ChurnRisk, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    items.sort((a, b) => (riskOrder[a.churnRisk] ?? 3) - (riskOrder[b.churnRisk] ?? 3))
  } else if (sort === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name))
  }
  const total = items.length
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    hasMore: start + limit < total,
  }
}

export function getCeoPipelineDeals(stage?: string): PaginatedResponse<PipelineDeal> {
  const items =
    stage && stage !== 'all'
      ? PIPELINE_DEALS.filter((d) => d.stage === stage)
      : PIPELINE_DEALS
  return { items, total: items.length, page: 1, limit: items.length, hasMore: false }
}
