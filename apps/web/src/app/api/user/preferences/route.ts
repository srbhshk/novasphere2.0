import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getUserPreferenceByUserId, upsertUserThemePreset } from '@novasphere/db'
import { createAuth } from '@/lib/auth/auth'
import { isValidThemePreset } from '@/lib/theme-presets'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readActiveOrganizationId(session: unknown): string {
  if (!isRecord(session)) {
    return 'org_demo'
  }
  const inner = session['session']
  if (!isRecord(inner)) {
    return 'org_demo'
  }
  const id = inner['activeOrganizationId']
  return typeof id === 'string' && id.length > 0 ? id : 'org_demo'
}

export async function GET(): Promise<NextResponse> {
  const auth = await createAuth()
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.id == null) {
    return NextResponse.json({ themePreset: null }, { status: 200 })
  }

  const row = await getUserPreferenceByUserId(session.user.id)
  return NextResponse.json({ themePreset: row?.themePreset ?? null }, { status: 200 })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const auth = await createAuth()
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.id == null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const raw = body['themePreset']
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'Invalid themePreset' }, { status: 400 })
  }
  if (!isValidThemePreset(raw)) {
    return NextResponse.json({ error: 'Invalid themePreset' }, { status: 400 })
  }

  const organizationId = readActiveOrganizationId(session)

  await upsertUserThemePreset({
    userId: session.user.id,
    organizationId,
    themePreset: raw,
  })

  return NextResponse.json({ themePreset: raw }, { status: 200 })
}
