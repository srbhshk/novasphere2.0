import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ENGINEER_DEPLOYMENTS } from '@/mocks/engineer.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

const querySchema = z.object({
  environment: z.enum(['all', 'production', 'staging']).default('all'),
  status: z
    .enum(['all', 'success', 'failed', 'in_progress', 'rolled_back'])
    .default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

  if (role !== 'engineer' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
  }

  const url = new URL(request.url)
  const params = querySchema.safeParse({
    environment: url.searchParams.get('environment'),
    status: url.searchParams.get('status'),
    limit: url.searchParams.get('limit'),
  })

  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: params.error.flatten() },
      { status: 400 },
    )
  }

  const { environment, status, limit } = params.data

  let items = [...ENGINEER_DEPLOYMENTS]
  if (environment !== 'all') items = items.filter((d) => d.environment === environment)
  if (status !== 'all') items = items.filter((d) => d.status === status)
  items = items.slice(0, limit)

  return NextResponse.json({ items, total: items.length })
}
