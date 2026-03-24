import { NextResponse } from 'next/server'
import { CEO_METRICS } from '@/mocks/ceo.mock'
import { ENGINEER_METRICS } from '@/mocks/engineer.mock'
import { ADMIN_METRICS } from '@/mocks/admin.mock'
import { VIEWER_METRICS } from '@/mocks/viewer.mock'

function resolveRole(roleHeader: string | null): 'ceo' | 'engineer' | 'admin' | 'viewer' {
  if (
    roleHeader === 'ceo' ||
    roleHeader === 'engineer' ||
    roleHeader === 'admin' ||
    roleHeader === 'viewer'
  ) {
    return roleHeader
  }
  return 'viewer'
}

export async function GET(request: Request): Promise<NextResponse> {
  const role = resolveRole(request.headers.get('x-user-role'))

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
