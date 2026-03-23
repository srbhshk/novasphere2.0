import type { CSSProperties } from 'react'
import { Skeleton } from '@novasphere/ui-glass'
import type { ChartVariant } from '../chart.types'

export type ChartSkeletonProps = {
  height?: number
  variant?: ChartVariant
}

export function ChartSkeleton({ height = 200, variant = 'default' }: ChartSkeletonProps) {
  const style: CSSProperties = {
    height,
  }

  const radiusClass =
    variant === 'compact'
      ? 'rounded-md'
      : variant === 'minimal'
        ? 'rounded-lg'
        : 'rounded-xl'

  return <Skeleton className={`w-full ${radiusClass}`} style={style} />
}
