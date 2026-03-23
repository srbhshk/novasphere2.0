import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import './Skeleton.module.css'

export type SkeletonRounded = 'sm' | 'md' | 'lg' | 'full'

export type SkeletonProps = {
  width?: string | number
  height?: string | number
  rounded?: SkeletonRounded
  lines?: number
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>

function toCssSize(value: string | number | undefined): string | undefined {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

export function Skeleton({
  width,
  height,
  rounded = 'md',
  lines = 1,
  className,
  ...rest
}: SkeletonProps) {
  const style: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
  }

  const items = Array.from({ length: Math.max(1, lines) })

  return (
    <div className="ns-skeleton-stack">
      {items.map((_, index) => (
        <div
          key={index}
          className={cn('ns-skeleton', `ns-skeleton-${rounded}`, className)}
          style={style}
          {...rest}
        />
      ))}
    </div>
  )
}
