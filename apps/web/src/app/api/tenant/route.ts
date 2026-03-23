import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveTenant } from '@novasphere/tenant-core'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tenantId = request.nextUrl.searchParams.get('tenantId') ?? 'demo'
  try {
    const tenant = await resolveTenant(tenantId)
    return NextResponse.json(tenant)
  } catch {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }
}
