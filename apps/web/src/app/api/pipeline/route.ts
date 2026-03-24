import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCeoPipelineDeals } from '@/mocks/ceo.mock'

const querySchema = z.object({
  stage: z
    .enum(['all', 'discovery', 'qualification', 'proposal', 'negotiation', 'closed-won'])
    .default('all'),
})

export async function GET(request: Request): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')

  if (role !== 'ceo' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
  }

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

  const result = getCeoPipelineDeals(
    params.data.stage === 'all' ? undefined : params.data.stage,
  )
  return NextResponse.json(result)
}
