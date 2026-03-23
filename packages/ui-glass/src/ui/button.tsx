import * as React from 'react'

import { cn } from '../lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost'
}

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        variant === 'default'
          ? 'bg-[color:var(--ns-color-accent)] text-black'
          : variant === 'secondary'
            ? 'bg-[color:var(--ns-glass-bg-medium)] text-[color:var(--ns-color-text)] border border-[color:var(--ns-color-border)]'
            : 'bg-transparent text-[color:var(--ns-color-text)]',
        className,
      )}
      {...props}
    />
  )
}

