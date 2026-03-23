import type { PropsWithChildren } from 'react'
import type { BentoColSpan, BentoRowSpan } from '../bento.types'

export type BentoSpanProps = PropsWithChildren<{
  col: BentoColSpan
  row?: BentoRowSpan
}>

export function BentoSpan({ col, row = 1, children }: BentoSpanProps) {
  const style: React.CSSProperties = {
    gridColumn: `span ${col} / span ${col}`,
    gridRow: `span ${row} / span ${row}`,
  }

  return <div style={style}>{children}</div>
}
