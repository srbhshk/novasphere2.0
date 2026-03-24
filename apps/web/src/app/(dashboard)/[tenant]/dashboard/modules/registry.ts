import type { BentoModuleRegistry } from '@novasphere/ui-bento'
import {
  MetricMRRModule,
  MetricARRModule,
  MetricNRRModule,
  MetricChurnModule,
  MetricARPUModule,
  MetricLTVModule,
  MetricConversionModule,
  MetricUsersModule,
  MetricApiLatencyModule,
  MetricErrorRateModule,
  MetricUptimeModule,
  MetricRequestVolumeModule,
  MetricNewSignupsModule,
  MetricActiveOrgsModule,
} from './MetricModules'
import {
  ChartRevenueModule,
  ChartRevenueComparisonModule,
  ChartChurnTrendModule,
  ChartUserGrowthModule,
  ChartTopCustomersModule,
  ChartPipelineModule,
  ChartPlanDistributionModule,
  ChartFeatureAdoptionModule,
  ChartResponseTimeModule,
  ChartErrorBreakdownModule,
  ChartActivityModule,
  ChartSparklineModule,
} from './ChartModules'
import { CustomerTableModule, PipelineTableModule } from './TableModules'
import {
  ActivityFeedModule,
  DeploymentLogModule,
  SystemAlertsModule,
} from './FeedModules'
import { AnomalyBannerModule } from './AnomalyModule'

export const MODULE_REGISTRY: BentoModuleRegistry = {
  // KPI — revenue / business
  'metric-mrr': MetricMRRModule,
  'metric-arr': MetricARRModule,
  'metric-nrr': MetricNRRModule,
  'metric-churn': MetricChurnModule,
  'metric-arpu': MetricARPUModule,
  'metric-ltv': MetricLTVModule,
  'metric-conversion': MetricConversionModule,
  'metric-users': MetricUsersModule,
  // KPI — platform / admin
  'metric-new-signups': MetricNewSignupsModule,
  'metric-active-orgs': MetricActiveOrgsModule,
  // KPI — infrastructure
  'metric-api-latency': MetricApiLatencyModule,
  'metric-error-rate': MetricErrorRateModule,
  'metric-uptime': MetricUptimeModule,
  'metric-request-volume': MetricRequestVolumeModule,
  // Charts — revenue / business
  'chart-revenue': ChartRevenueModule,
  'chart-revenue-comparison': ChartRevenueComparisonModule,
  'chart-churn-trend': ChartChurnTrendModule,
  'chart-user-growth': ChartUserGrowthModule,
  'chart-top-customers': ChartTopCustomersModule,
  'chart-pipeline': ChartPipelineModule,
  // Charts — admin / platform
  'chart-plan-distribution': ChartPlanDistributionModule,
  'chart-feature-adoption': ChartFeatureAdoptionModule,
  // Charts — infrastructure
  'chart-response-time': ChartResponseTimeModule,
  'chart-error-breakdown': ChartErrorBreakdownModule,
  'chart-activity': ChartActivityModule,
  'chart-sparkline': ChartSparklineModule,
  // Tables
  'customer-table': CustomerTableModule,
  'pipeline-table': PipelineTableModule,
  // Feeds
  'activity-feed': ActivityFeedModule,
  'deployment-log': DeploymentLogModule,
  'system-alerts': SystemAlertsModule,
  // AI explanations
  'anomaly-banner': AnomalyBannerModule,
}
