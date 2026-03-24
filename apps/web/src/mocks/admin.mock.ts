import type { AdminMetricsResponse, ActivityEvent, PaginatedResponse } from './mock.types'
import {
  buildHeatmap,
  buildMonthLabels,
  buildSparkline,
  companyName,
  fullName,
  seedInt,
  BASE_DATE_MS,
  isoOffset,
} from './shared.mock'

const MONTH_LABELS = buildMonthLabels(12)

const USER_GROWTH = MONTH_LABELS.map((label, i) => ({
  label,
  value: Math.round(10_000 + i * 240 + seedInt(i * 5, -100, 100)),
  value2: Math.round(8_500 + i * 210 + seedInt(i * 5 + 2, -80, 80)),
}))

const PLAN_DISTRIBUTION = [
  { id: 'enterprise', label: 'Enterprise', value: 847 },
  { id: 'pro', label: 'Pro', value: 2_841 },
  { id: 'free', label: 'Free', value: 9_159 },
]

const FEATURE_ADOPTION = [
  { label: 'AI Copilot', value: 78 },
  { label: 'Bento Reorder', value: 65 },
  { label: 'Custom Layouts', value: 54 },
  { label: 'Theme Switching', value: 91 },
  { label: 'Export Reports', value: 38 },
]

const EVENT_TEMPLATES = [
  (i: number): ActivityEvent => ({
    id: `evt-signup-${i}`,
    type: 'signup',
    message: `New signup: ${fullName(i * 7)
      .toLowerCase()
      .replace(' ', '.')}@${companyName(i * 11)
      .toLowerCase()
      .replace(' ', '')}.io`,
    timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 3, 0, 14)),
    severity: 'info',
    actor: fullName(i * 7),
    meta: { plan: 'free' },
  }),
  (i: number): ActivityEvent => ({
    id: `evt-upgrade-${i}`,
    type: 'plan_upgrade',
    message: `${companyName(i * 13)} upgraded from Free to Pro`,
    timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 5, 0, 20)),
    severity: 'info',
    meta: { from: 'free', to: 'pro' },
  }),
  (i: number): ActivityEvent => ({
    id: `evt-ticket-${i}`,
    type: 'support_ticket',
    message: `Support ticket opened by ${fullName(i * 19)}: "${['Dashboard not loading', 'AI response delay', 'Export CSV bug', 'Login issue on SSO', 'Billing discrepancy'][i % 5]}"`,
    timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 7, 0, 10)),
    severity: i % 3 === 0 ? 'warning' : 'info',
    actor: fullName(i * 19),
  }),
  (i: number): ActivityEvent => ({
    id: `evt-config-${i}`,
    type: 'config_change',
    message: `Admin ${fullName(i * 23)} updated ${['RBAC policy', 'SSO configuration', 'Rate limits', 'Audit log retention', 'Data residency region'][i % 5]}`,
    timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 9, 0, 30)),
    severity: 'warning',
    actor: fullName(i * 23),
  }),
  (i: number): ActivityEvent => ({
    id: `evt-churn-${i}`,
    type: 'churn',
    message: `${companyName(i * 17)} cancelled their Pro subscription`,
    timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 11, 0, 21)),
    severity: 'error',
    meta: { plan: 'pro', reason: 'Pricing' },
  }),
]

function buildAdminActivity(): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (let i = 0; i < 10; i++) {
    for (const template of EVENT_TEMPLATES) {
      events.push(template(i))
    }
  }
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

const ALL_ADMIN_ACTIVITY = buildAdminActivity()

export function getAdminActivity(
  page: number,
  limit: number,
): PaginatedResponse<ActivityEvent> {
  const total = ALL_ADMIN_ACTIVITY.length
  const start = (page - 1) * limit
  return {
    items: ALL_ADMIN_ACTIVITY.slice(start, start + limit),
    total,
    page,
    limit,
    hasMore: start + limit < total,
  }
}

export const ADMIN_METRICS: AdminMetricsResponse = {
  kpis: [
    {
      id: 'total-users',
      label: 'Total Users',
      value: 12_847,
      trend: 8.7,
      deltaDirection: 'up',
      unit: 'count',
      sparkline: buildSparkline(12_847, 7, 0.04, 300),
    },
    {
      id: 'new-signups',
      label: 'New Signups / Week',
      value: 342,
      trend: 11.2,
      deltaDirection: 'up',
      unit: 'count',
      sparkline: buildSparkline(342, 7, 0.1, 310),
    },
    {
      id: 'active-orgs',
      label: 'Active Organisations',
      value: 1_847,
      trend: 5.4,
      deltaDirection: 'up',
      unit: 'count',
      sparkline: buildSparkline(1_847, 7, 0.05, 320),
    },
    {
      id: 'mrr',
      label: 'MRR',
      value: 847_500,
      trend: 12.3,
      deltaDirection: 'up',
      unit: 'currency',
      sparkline: buildSparkline(847_500, 7, 0.04, 330),
      prefix: '$',
    },
    {
      id: 'conversion',
      label: 'Trial Conversion',
      value: 24,
      trend: -1.8,
      deltaDirection: 'down',
      unit: 'percent',
      sparkline: buildSparkline(24, 7, 0.06, 340),
      suffix: '%',
    },
  ],
  planDistribution: PLAN_DISTRIBUTION,
  userGrowth: USER_GROWTH,
  featureAdoption: FEATURE_ADOPTION,
  activityHeatmap: buildHeatmap(700),
}
