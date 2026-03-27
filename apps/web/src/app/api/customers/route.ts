import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCeoCustomers } from '@/mocks/ceo.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['mrr', 'risk', 'name']).default('mrr'),
  risk: z.enum(['all', 'low', 'medium', 'high', 'critical']).default('all'),
})

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

  if (role !== 'ceo' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
  }

  const url = new URL(request.url)
  const params = querySchema.safeParse({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
    sort: url.searchParams.get('sort'),
    risk: url.searchParams.get('risk'),
  })

  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: params.error.flatten() },
      { status: 400 },
    )
  }

  const { page, limit, sort, risk } = params.data
  const result = getCeoCustomers(page, limit, sort, risk === 'all' ? undefined : risk)
  return NextResponse.json(result)
}
