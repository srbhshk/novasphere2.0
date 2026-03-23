import * as React from 'react'

import { cn } from '../lib/utils'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border px-3 py-2 text-sm outline-none',
        'bg-[color:var(--ns-glass-bg-subtle)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]',
        className,
      )}
      {...props}
    />
  )
}

