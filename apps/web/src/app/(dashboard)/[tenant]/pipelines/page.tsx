'use client'

import { GitBranch } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import { DonutChart } from '@novasphere/ui-charts'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { usePipelineDeals } from '@/hooks/usePipelineDeals'

export default function PipelinesPage(): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = usePipelineDeals({ role, stage: 'all' })
  const pipelineData = (data?.items ?? []).reduce<
    Array<{ id: string; label: string; value: number }>
  >((acc, deal) => {
    const existing = acc.find((item) => item.id === deal.stage)
    if (existing != null) {
      existing.value += 1
      return acc
    }
    acc.push({ id: deal.stage, label: deal.stage, value: 1 })
    return acc
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <GitBranch className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Pipelines</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Workflow and execution monitoring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard variant="medium" className="col-span-12 p-5 xl:col-span-4">
          <div className="mb-3 text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
            Pipeline by Stage
          </div>
          <DonutChart data={pipelineData} loading={isLoading} height={220} />
        </GlassCard>

        <GlassCard variant="medium" className="col-span-12 p-5 xl:col-span-8">
          <div className="mb-3 text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
            Recent Deals
          </div>
          <div className="space-y-2">
            {(data?.items ?? []).slice(0, 8).map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-lg bg-[var(--ns-glass-bg-subtle)] px-3 py-2 text-sm"
              >
                <span className="truncate text-[var(--ns-color-text)]">
                  {deal.company}
                </span>
                <span className="text-[var(--ns-color-muted)]">
                  ${deal.value.toLocaleString()}
                </span>
              </div>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 ? (
              <p className="text-sm text-[var(--ns-color-muted)]">
                No pipeline deals available.
              </p>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
