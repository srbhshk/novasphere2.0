import * as React from 'react'

import { cn } from '../lib/utils'

export function Avatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        'relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export function AvatarImage({
  className,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>): React.JSX.Element {
  return (
    <img
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-[color:var(--ns-glass-bg-subtle)] text-xs text-[color:var(--ns-color-text)]',
        className,
      )}
      {...props}
    />
  )
}

