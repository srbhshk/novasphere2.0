import { NextResponse } from 'next/server'
import { ENGINEER_METRICS, SYSTEM_ALERTS } from '@/mocks/engineer.mock'
import { resolveRoleFromSession } from '@/lib/auth/resolve-role'

export async function GET(request: Request): Promise<NextResponse> {
  const role = await resolveRoleFromSession(request)

  if (role === 'engineer' || role === 'admin') {
    return NextResponse.json({
      scope: 'full',
      kpis: ENGINEER_METRICS.kpis,
      responseTimeTrend: ENGINEER_METRICS.responseTimeTrend,
      errorBreakdown: ENGINEER_METRICS.errorBreakdown,
      alerts: SYSTEM_ALERTS,
      cpuSparkline: ENGINEER_METRICS.cpuSparkline,
      memorySparkline: ENGINEER_METRICS.memorySparkline,
    })
  }

  // ceo, viewer: summary — unresolved and high-severity alerts only (no infra detail)
  const alerts = SYSTEM_ALERTS.map(({ id, title, severity, resolved }) => ({
    id,
    title,
    severity,
    resolved,
  }))

  return NextResponse.json({
    scope: 'summary',
    alerts,
  })
}
