'use client'

import * as React from 'react'

export type SvgLoaderProps = {
  label?: string | undefined
  className?: string | undefined
  size?: number | undefined
}

export function SvgLoader({
  label = 'Loading',
  className,
  size = 44,
}: SvgLoaderProps): React.JSX.Element {
  const safeSize = Number.isFinite(size) && size > 0 ? size : 44
  const strokeWidth = 3
  const r = 18
  const cx = 24
  const cy = 24
  const circumference = 2 * Math.PI * r
  const dash = Math.round(circumference * 0.72)
  const gap = Math.round(circumference - dash)

  return (
    <div className={className} role="status" aria-live="polite" aria-label={label}>
      <svg
        width={safeSize}
        height={safeSize}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ns-loader-grad" x1="12" y1="8" x2="36" y2="40">
            <stop offset="0%" stopColor="var(--ns-color-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--ns-color-accent)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="var(--ns-color-border)"
          strokeWidth={strokeWidth}
          opacity="0.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="url(#ns-loader-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="1.1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
