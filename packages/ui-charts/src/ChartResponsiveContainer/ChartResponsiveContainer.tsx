'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { ResponsiveContainer } from 'recharts'

export type ChartResponsiveContainerProps = {
  children: ReactElement
  /** When set, outer wrapper uses this fixed height (px). Omit for flex-driven height. */
  height?: number
  className?: string
  style?: CSSProperties
}

/**
 * Recharts {@link ResponsiveContainer} measures its parent; in flex/grid shells the first
 * paint often yields 0×0 and logs width/height -1. We observe the wrapper and pass
 * numeric dimensions only once layout has settled.
 */
export function ChartResponsiveContainer({
  children,
  height,
  className,
  style,
}: ChartResponsiveContainerProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const applyRect = (width: number, rectHeight: number): void => {
      const w = Math.max(0, Math.floor(width))
      const h = Math.max(0, Math.floor(rectHeight))
      if (w > 0 && h > 0) {
        setDims((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }))
      }
    }

    const readFromDom = (): void => {
      const rect = el.getBoundingClientRect()
      applyRect(rect.width, rect.height)
    }

    readFromDom()

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry != null) {
        applyRect(entry.contentRect.width, entry.contentRect.height)
      } else {
        readFromDom()
      }
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [height])

  const mergedStyle: CSSProperties = {
    width: '100%',
    ...(height != null ? { height } : {}),
    ...style,
  }

  return (
    <div ref={ref} className={className} style={mergedStyle}>
      {dims != null ? (
        <ResponsiveContainer width={dims.w} height={dims.h} minWidth={0} minHeight={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}
