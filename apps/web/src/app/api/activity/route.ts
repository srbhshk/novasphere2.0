import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminActivity, getViewerActivity } from '@/mocks/admin.mock'
import { getEngineerActivity } from '@/mocks/engineer.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

  const url = new URL(request.url)
  const params = querySchema.safeParse({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
  })

  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: params.error.flatten() },
      { status: 400 },
    )
  }

  const { page, limit } = params.data

  const result =
    role === 'engineer'
      ? getEngineerActivity(page, limit)
      : role === 'viewer'
        ? getViewerActivity(page, limit)
        : getAdminActivity(page, limit)

  return NextResponse.json(result)
}
