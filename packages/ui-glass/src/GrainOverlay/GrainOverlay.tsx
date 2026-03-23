import type { SVGAttributes } from 'react'
import { cn } from '../lib/utils'
import './GrainOverlay.module.css'

export type GrainOverlayProps = SVGAttributes<SVGSVGElement>

export function GrainOverlay({ className, ...rest }: GrainOverlayProps) {
  return (
    <svg
      className={cn('ns-grain-overlay', className)}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <filter id="ns-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#ns-noise)" />
    </svg>
  )
}
