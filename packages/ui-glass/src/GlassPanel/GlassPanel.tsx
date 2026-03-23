import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import './GlassPanel.module.css'

export type GlassPanelVariant = 'subtle' | 'medium' | 'strong'

export type GlassPanelProps = {
  variant?: GlassPanelVariant
  header?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function GlassPanel({
  variant = 'strong',
  header,
  footer,
  className,
  children,
}: GlassPanelProps) {
  const hasHeaderOrFooter = !!header || !!footer

  return (
    <section
      className={cn('ns-glass-panel', `ns-glass-panel-${variant}`, className)}
      aria-label={typeof header === 'string' ? header : undefined}
    >
      {header ? <div className="ns-glass-panel-header">{header}</div> : null}
      {hasHeaderOrFooter ? (
        <div className="ns-glass-panel-body">{children}</div>
      ) : (
        children
      )}
      {footer ? <div className="ns-glass-panel-footer">{footer}</div> : null}
    </section>
  )
}
