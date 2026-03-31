'use client'

import type { BentoCardModuleProps } from '@novasphere/ui-bento'
import { Badge } from '@novasphere/ui-glass'
import type { ColumnDef } from '@novasphere/ui-glass'
import { DataTable } from '@novasphere/ui-glass'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { useCustomerList } from '@/hooks/useCustomerList'
import { usePipelineDeals } from '@/hooks/usePipelineDeals'
import type {
  CustomerRow,
  PipelineDeal,
  ChurnRisk,
  PipelineDealStage,
} from '@/lib/api/contracts'
import { ModuleWrapper } from './ModuleWrapper'

function formatCurrency(value: number): string {
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RISK_VARIANT: Record<
  ChurnRisk,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  low: 'default',
  medium: 'secondary',
  high: 'outline',
  critical: 'destructive',
}

const STAGE_LABEL: Record<PipelineDealStage, string> = {
  discovery: 'Discovery',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

const CUSTOMER_COLUMNS: ColumnDef<CustomerRow>[] = [
  {
    key: 'name',
    header: 'Company',
    accessor: (row: CustomerRow) => (
      <span className="font-medium text-[var(--ns-color-text)]">{row.name}</span>
    ),
    sortValue: (row: CustomerRow) => row.name,
    width: '30%',
  },
  {
    key: 'plan',
    header: 'Plan',
    accessor: (row: CustomerRow) => (
      <Badge
        variant={row.plan === 'enterprise' ? 'default' : 'secondary'}
        className="capitalize"
      >
        {row.plan}
      </Badge>
    ),
    sortValue: (row: CustomerRow) => row.plan,
    width: '18%',
  },
  {
    key: 'mrr',
    header: 'MRR',
    accessor: (row: CustomerRow) => formatCurrency(row.mrr),
    sortValue: (row: CustomerRow) => row.mrr,
    width: '18%',
    align: 'right',
  },
  {
    key: 'churnRisk',
    header: 'Churn Risk',
    accessor: (row: CustomerRow) => (
      <Badge variant={RISK_VARIANT[row.churnRisk] ?? 'secondary'} className="capitalize">
        {row.churnRisk}
      </Badge>
    ),
    sortValue: (row: CustomerRow) => row.churnRisk,
    width: '18%',
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    accessor: (row: CustomerRow) => (
      <span className="text-[var(--ns-color-muted)]">{formatDate(row.lastActive)}</span>
    ),
    sortValue: (row: CustomerRow) => row.lastActive,
    width: '16%',
  },
]

const PIPELINE_COLUMNS: ColumnDef<PipelineDeal>[] = [
  {
    key: 'company',
    header: 'Company',
    accessor: (row: PipelineDeal) => (
      <span className="font-medium text-[var(--ns-color-text)]">{row.company}</span>
    ),
    sortValue: (row: PipelineDeal) => row.company,
    width: '28%',
  },
  {
    key: 'value',
    header: 'Value',
    accessor: (row: PipelineDeal) => formatCurrency(row.value),
    sortValue: (row: PipelineDeal) => row.value,
    width: '16%',
    align: 'right',
  },
  {
    key: 'stage',
    header: 'Stage',
    accessor: (row: PipelineDeal) => (
      <span className="text-xs text-[var(--ns-color-muted)]">
        {STAGE_LABEL[row.stage] ?? row.stage}
      </span>
    ),
    sortValue: (row: PipelineDeal) => row.stage,
    width: '20%',
  },
  {
    key: 'owner',
    header: 'Owner',
    accessor: (row: PipelineDeal) => (
      <span className="text-[var(--ns-color-muted)]">{row.owner.split(' ')[0]}</span>
    ),
    width: '18%',
  },
  {
    key: 'probability',
    header: 'Win %',
    accessor: (row: PipelineDeal) => (
      <span
        className={
          row.probability >= 70
            ? 'font-semibold text-[var(--ns-color-success)]'
            : 'text-[var(--ns-color-muted)]'
        }
      >
        {row.probability}%
      </span>
    ),
    sortValue: (row: PipelineDeal) => row.probability,
    width: '10%',
    align: 'right',
  },
  {
    key: 'expectedClose',
    header: 'Close',
    accessor: (row: PipelineDeal) => (
      <span className="text-xs text-[var(--ns-color-muted)]">
        {formatDate(row.expectedClose)}
      </span>
    ),
    sortValue: (row: PipelineDeal) => row.expectedClose,
    width: '14%',
  },
]

export function CustomerTableModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = useCustomerList({ role, limit: 10, sort: 'mrr' })
  const wrapperTitle = config.title ? undefined : 'Top Customers'
  return (
    <ModuleWrapper title={wrapperTitle}>
      <div className="max-h-[420px] overflow-y-auto">
        <DataTable<CustomerRow>
          columns={CUSTOMER_COLUMNS}
          data={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No customers found"
          skeletonRows={5}
        />
      </div>
    </ModuleWrapper>
  )
}

export function PipelineTableModule({ config }: BentoCardModuleProps): React.JSX.Element {
  const { role } = useCurrentRole()
  const { data, isLoading } = usePipelineDeals({ role, stage: 'all' })
  const deals = data?.items.slice(0, 12) ?? []
  const wrapperTitle = config.title ? undefined : 'Active Pipeline'
  return (
    <ModuleWrapper title={wrapperTitle}>
      <div className="max-h-[420px] overflow-y-auto">
        <DataTable<PipelineDeal>
          columns={PIPELINE_COLUMNS}
          data={deals}
          loading={isLoading}
          emptyMessage="No pipeline deals found"
          skeletonRows={5}
        />
      </div>
    </ModuleWrapper>
  )
}
