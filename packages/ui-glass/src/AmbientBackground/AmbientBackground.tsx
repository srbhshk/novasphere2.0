'use client'

import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import './AmbientBackground.module.css'

export type AmbientBackgroundProps = HTMLAttributes<HTMLDivElement>

export function AmbientBackground({ className, ...rest }: AmbientBackgroundProps) {
  return (
    <div className={cn('ns-ambient-bg-root', className)} aria-hidden="true" {...rest}>
      <div className={cn('ns-ambient-orb', 'ns-ambient-orb-primary')} />
      <div className={cn('ns-ambient-orb', 'ns-ambient-orb-secondary')} />
      <div className={cn('ns-ambient-orb', 'ns-ambient-orb-tertiary')} />

      <svg
        className="ns-ambient-grid-svg"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="ns-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-grid)" />
      </svg>
    </div>
  )
}
