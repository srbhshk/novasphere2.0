'use client'

import { BarChart2 } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import { AreaChart, BarChart, DonutChart } from '@novasphere/ui-charts'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import type { CeoMetricsResponse, AdminMetricsResponse } from '@/mocks/mock.types'

export default function AnalyticsPage(): React.JSX.Element {
  const { role } = useCurrentRole()
  const metricsRole = role === 'engineer' ? 'ceo' : role === 'viewer' ? 'viewer' : role
  const { data, isLoading } = useDashboardMetrics(metricsRole)

  const revenueHistory =
    (data as CeoMetricsResponse | undefined)?.revenueHistory ??
    (data as { revenueHistory?: CeoMetricsResponse['revenueHistory'] } | undefined)
      ?.revenueHistory ??
    []

  const pipeline = (data as CeoMetricsResponse | undefined)?.pipelineByStage ?? []

  const planDistribution =
    (data as AdminMetricsResponse | undefined)?.planDistribution ?? []

  const featureAdoption =
    (data as AdminMetricsResponse | undefined)?.featureAdoption ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <BarChart2 className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Analytics</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Historical trends and deep-dive charts
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue trend */}
        {revenueHistory.length > 0 || isLoading ? (
          <GlassCard
            variant="medium"
            className="col-span-12 flex flex-col gap-3 p-5 xl:col-span-8"
          >
            <div className="text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
              Revenue vs Prior Year
            </div>
            <AreaChart data={revenueHistory} loading={isLoading} height={220} />
          </GlassCard>
        ) : null}

        {/* Pipeline donut */}
        {pipeline.length > 0 || isLoading ? (
          <GlassCard
            variant="medium"
            className="col-span-12 flex flex-col gap-3 p-5 xl:col-span-4"
          >
            <div className="text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
              Pipeline by Stage
            </div>
            <DonutChart data={pipeline} loading={isLoading} height={180} />
          </GlassCard>
        ) : null}

        {/* Plan distribution */}
        {planDistribution.length > 0 || (role === 'admin' && isLoading) ? (
          <GlassCard
            variant="medium"
            className="col-span-12 flex flex-col gap-3 p-5 xl:col-span-4"
          >
            <div className="text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
              Plan Distribution
            </div>
            <DonutChart data={planDistribution} loading={isLoading} height={180} />
          </GlassCard>
        ) : null}

        {/* Feature adoption */}
        {featureAdoption.length > 0 || (role === 'admin' && isLoading) ? (
          <GlassCard
            variant="medium"
            className="col-span-12 flex flex-col gap-3 p-5 xl:col-span-8"
          >
            <div className="text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
              Feature Adoption
            </div>
            <BarChart
              data={featureAdoption}
              loading={isLoading}
              height={200}
              orientation="horizontal"
            />
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}
