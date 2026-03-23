'use client'

import { cn } from '../lib/utils'
import './TypingIndicator.module.css'

export type TypingIndicatorProps = {
  visible: boolean
  className?: string
}

export function TypingIndicator({
  visible,
  className,
}: TypingIndicatorProps): React.JSX.Element | null {
  if (!visible) return null

  return (
    <div className={cn('ns-agent-typing-container', className)} aria-hidden="true">
      <span className="ns-agent-typing-dot" />
      <span className="ns-agent-typing-dot" />
      <span className="ns-agent-typing-dot" />
    </div>
  )
}
