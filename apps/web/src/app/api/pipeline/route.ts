import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCeoPipelineDeals, getPipelineStageAggregates } from '@/mocks/ceo.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

const querySchema = z.object({
  stage: z
    .enum(['all', 'discovery', 'qualification', 'proposal', 'negotiation', 'closed-won'])
    .default('all'),
})

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

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
