import { NextResponse } from 'next/server'
import {
  MOCK_MRR,
  MOCK_CHURN,
  MOCK_ACTIVE_USERS,
  MOCK_REVENUE_HISTORY,
  MOCK_PIPELINE_STAGES,
  MOCK_ACTIVITY_HEATMAP,
  MOCK_SPARKLINE_DATA,
} from '@/mocks/metrics.mock'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    mrr: MOCK_MRR,
    churn: MOCK_CHURN,
    activeUsers: MOCK_ACTIVE_USERS,
    revenueHistory: MOCK_REVENUE_HISTORY,
    pipelineStages: MOCK_PIPELINE_STAGES,
    activityHeatmap: MOCK_ACTIVITY_HEATMAP,
    sparklineData: MOCK_SPARKLINE_DATA,
  })
}
