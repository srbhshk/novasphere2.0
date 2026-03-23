import * as React from 'react'

import { cn } from '../lib/utils'

export function ScrollArea({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('relative overflow-auto', className)} {...props} />
  )
}

export function ScrollBar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('h-2 w-2 rounded-full bg-[color:var(--ns-glass-bg-subtle)]', className)}
      {...props}
    />
  )
}

