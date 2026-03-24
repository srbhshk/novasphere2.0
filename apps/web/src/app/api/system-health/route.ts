import { NextResponse } from 'next/server'
import { ENGINEER_METRICS, SYSTEM_ALERTS } from '@/mocks/engineer.mock'

export async function GET(request: Request): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')

  if (role !== 'engineer' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
  }

  return NextResponse.json({
    kpis: ENGINEER_METRICS.kpis,
    responseTimeTrend: ENGINEER_METRICS.responseTimeTrend,
    errorBreakdown: ENGINEER_METRICS.errorBreakdown,
    alerts: SYSTEM_ALERTS,
    cpuSparkline: ENGINEER_METRICS.cpuSparkline,
    memorySparkline: ENGINEER_METRICS.memorySparkline,
  })
}
