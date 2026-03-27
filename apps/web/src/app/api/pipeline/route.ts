import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCeoPipelineDeals, getPipelineStageAggregates } from '@/mocks/ceo.mock'

const querySchema = z.object({
  stage: z
    .enum(['all', 'discovery', 'qualification', 'proposal', 'negotiation', 'closed-won'])
    .default('all'),
})

function resolveRole(header: string | null): 'admin' | 'ceo' | 'engineer' | 'viewer' {
  if (
    header === 'admin' ||
    header === 'ceo' ||
    header === 'engineer' ||
    header === 'viewer'
  ) {
    return header
  }
  return 'viewer'
}

export async function GET(request: Request): Promise<NextResponse> {
  const role = resolveRole(request.headers.get('x-user-role'))

  const url = new URL(request.url)
  const params = querySchema.safeParse({
    stage: url.searchParams.get('stage'),
  })

  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: params.error.flatten() },
      { status: 400 },
    )
  }

  const stage = params.data.stage === 'all' ? undefined : params.data.stage

  if (role === 'ceo' || role === 'admin') {
    const result = getCeoPipelineDeals(stage)
    return NextResponse.json({ ...result, scope: 'full' })
  }

  if (role === 'engineer') {
    const result = getPipelineStageAggregates(stage)
    return NextResponse.json({ ...result, scope: 'aggregates' })
  }

  // viewer: no pipeline rows for this role (access-scoped empty result, not an error)
  return NextResponse.json({
    items: [],
    total: 0,
    page: 1,
    limit: 0,
    hasMore: false,
    scope: 'none',
  })
}
