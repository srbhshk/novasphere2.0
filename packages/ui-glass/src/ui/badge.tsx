import * as React from 'react'

import { cn } from '../lib/utils'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:
    'bg-[color:var(--ns-color-accent-10)] text-[color:var(--ns-color-accent)] border-[color:var(--ns-color-accent)]/30',
  secondary:
    'bg-[color:var(--ns-glass-bg-subtle)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]',
  destructive:
    'bg-red-500/10 text-red-400 border-red-500/30',
  outline:
    'bg-transparent text-[color:var(--ns-color-muted)] border-[color:var(--ns-color-border-subtle)]',
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
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}

