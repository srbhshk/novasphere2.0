import { NextResponse } from 'next/server'
import { CEO_METRICS } from '@/mocks/ceo.mock'
import { ENGINEER_METRICS } from '@/mocks/engineer.mock'
import { ADMIN_METRICS } from '@/mocks/admin.mock'
import { VIEWER_METRICS } from '@/mocks/viewer.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

  const payload =
    role === 'ceo'
      ? CEO_METRICS
      : role === 'engineer'
        ? ENGINEER_METRICS
        : role === 'admin'
          ? ADMIN_METRICS
          : VIEWER_METRICS

  return NextResponse.json(payload)
}
