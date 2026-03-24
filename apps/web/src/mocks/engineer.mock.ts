import type {
  EngineerMetricsResponse,
  Deployment,
  SystemAlert,
  BarDataPoint,
  PaginatedResponse,
  ActivityEvent,
} from './mock.types'
import {
  buildHeatmap,
  buildSparkline,
  fullName,
  seedInt,
  BASE_DATE_MS,
  isoOffset,
} from './shared.mock'

const LATENCY_TREND = Array.from({ length: 24 }, (_, i) => ({
  label: `${String(i).padStart(2, '0')}:00`,
  value: Math.round(82 + Math.sin(i * 0.4) * 18 + seedInt(i * 7, -8, 8)),
  value2: Math.round(210 + Math.sin(i * 0.4 + 1) * 35 + seedInt(i * 7 + 1, -15, 15)),
}))

const ERROR_BREAKDOWN: BarDataPoint[] = [
  { label: '/api/agent', value: 42 },
  { label: '/api/metrics', value: 18 },
  { label: '/api/auth', value: 11 },
  { label: '/api/tenant', value: 8 },
  { label: '/api/pipeline', value: 6 },
  { label: '/api/customers', value: 4 },
]

const ENDPOINTS = [
  '/api/agent',
  '/api/metrics',
  '/api/auth/sign-in',
  '/api/tenant',
  '/api/pipeline',
  '/api/deployments',
  '/api/system-health',
  '/api/customers',
]

const STATUSES = [
  'success',
  'failed',
  'success',
  'success',
  'rolled_back',
  'success',
  'in_progress',
  'success',
  'success',
  'failed',
] as const

const COMMIT_MESSAGES = [
  'fix: resolve agent streaming timeout on slow models',
  'feat: add role-scoped metrics endpoint',
  'chore: bump qwen2.5 to 0.5b-instruct',
  'fix: correct pipeline stage ordering in donut chart',
  'feat: implement customer churn risk scoring',
  'fix: resolve memory leak in layout store',
  'chore: update Drizzle ORM to latest',
  'feat: add deployment status webhook',
  'fix: repair BentoColSpan type union',
  'feat: engineer latency heatmap module',
]

export const ENGINEER_DEPLOYMENTS: Deployment[] = Array.from({ length: 10 }, (_, i) => ({
  id: `deploy-${String(i + 1).padStart(3, '0')}`,
  version: `v2.${3 - Math.floor(i / 4)}.${(10 - i) % 10}`,
  commit: `a${(4e9 - i * 1_234_567).toString(16).slice(0, 7)}`,
  commitMessage: COMMIT_MESSAGES[i] ?? 'chore: update dependencies',
  author: fullName(i * 23),
  environment: i % 4 === 0 ? 'staging' : 'production',
  status: STATUSES[i] ?? 'success',
  startedAt: isoOffset(BASE_DATE_MS, -(i * 2)),
  duration: seedInt(i * 13, 45, 380),
}))

export const SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: 'alert-001',
    title: 'Elevated Churn API Latency',
    description: 'p99 latency on /api/agent exceeded 2s SLO for 15 minutes.',
    severity: 'warning',
    startsAt: isoOffset(BASE_DATE_MS, -1),
    resolved: false,
    service: 'agent-api',
  },
  {
    id: 'alert-002',
    title: 'Disk Usage at 78%',
    description: 'SQLite data volume on app-db-01 is approaching the 80% threshold.',
    severity: 'warning',
    startsAt: isoOffset(BASE_DATE_MS, -3),
    resolved: false,
    service: 'database',
  },
  {
    id: 'alert-003',
    title: 'Error Spike on /api/auth',
    description:
      '18 5xx errors on /api/auth in the last 10 minutes. Rolling back v2.2.9.',
    severity: 'critical',
    startsAt: isoOffset(BASE_DATE_MS, -5),
    resolved: true,
    service: 'auth-api',
  },
]

export function getEngineerActivity(
  page: number,
  limit: number,
): PaginatedResponse<ActivityEvent> {
  const events: ActivityEvent[] = [
    ...ENGINEER_DEPLOYMENTS.map(
      (d, i): ActivityEvent => ({
        id: `evt-deploy-${i}`,
        type: 'deployment',
        message: `Deployed ${d.version} to ${d.environment} — ${d.commitMessage}`,
        timestamp: d.startedAt,
        severity: d.status === 'failed' || d.status === 'rolled_back' ? 'error' : 'info',
        actor: d.author,
        meta: { environment: d.environment, status: d.status },
      }),
    ),
    ...SYSTEM_ALERTS.map(
      (a, i): ActivityEvent => ({
        id: `evt-alert-${i}`,
        type: a.severity === 'critical' ? 'incident' : 'alert',
        message: `${a.title}: ${a.description}`,
        timestamp: a.startsAt,
        severity: a.severity === 'critical' ? 'error' : 'warning',
        meta: { service: a.service, resolved: String(a.resolved) },
      }),
    ),
    ...Array.from(
      { length: 8 },
      (_, i): ActivityEvent => ({
        id: `evt-error-${i}`,
        type: 'error_spike',
        message: `Error rate spike on ${ENDPOINTS[i % ENDPOINTS.length]}: ${seedInt(i * 3 + 9, 5, 40)} errors in 5 min`,
        timestamp: isoOffset(BASE_DATE_MS, -seedInt(i * 7, 0, 10)),
        severity: 'warning',
      }),
    ),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const total = events.length
  const start = (page - 1) * limit
  return {
    items: events.slice(start, start + limit),
    total,
    page,
    limit,
    hasMore: start + limit < total,
  }
}

export const ENGINEER_METRICS: EngineerMetricsResponse = {
  kpis: [
    {
      id: 'api-latency-p50',
      label: 'API Latency (p50)',
      value: 82,
      trend: -3.1,
      deltaDirection: 'down',
      unit: 'ms',
      sparkline: buildSparkline(82, 7, 0.08, 100),
      suffix: 'ms',
    },
    {
      id: 'api-latency-p99',
      label: 'API Latency (p99)',
      value: 248,
      trend: 8.4,
      deltaDirection: 'up',
      unit: 'ms',
      sparkline: buildSparkline(248, 7, 0.1, 110),
      anomaly: true,
      suffix: 'ms',
    },
    {
      id: 'error-rate',
      label: 'Error Rate',
      value: 0.12,
      trend: 0.03,
      deltaDirection: 'up',
      unit: 'percent',
      sparkline: buildSparkline(0.12, 7, 0.15, 120),
      suffix: '%',
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: 99.97,
      trend: 0,
      deltaDirection: 'flat',
      unit: 'percent',
      sparkline: buildSparkline(99.97, 7, 0.001, 130),
      suffix: '%',
    },
    {
      id: 'request-volume',
      label: 'Requests / day',
      value: 2_418_000,
      trend: 6.2,
      deltaDirection: 'up',
      unit: 'count',
      sparkline: buildSparkline(2_418_000, 7, 0.06, 140),
    },
  ],
  responseTimeTrend: LATENCY_TREND,
  errorBreakdown: ERROR_BREAKDOWN,
  activityHeatmap: buildHeatmap(500),
  cpuSparkline: buildSparkline(61, 7, 0.12, 160).map((v) => ({ value: v })),
  memorySparkline: buildSparkline(74, 7, 0.06, 170).map((v) => ({ value: v })),
}
