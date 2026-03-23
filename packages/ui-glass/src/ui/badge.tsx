import * as React from 'react'

import { cn } from '../lib/utils'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary'
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variant === 'secondary'
          ? 'bg-[color:var(--ns-glass-bg-subtle)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]'
          : 'bg-[color:var(--ns-color-accent-10)] text-[color:var(--ns-color-accent)] border-[color:var(--ns-color-accent)]',
        className,
      )}
      {...props}
    />
  )
}

