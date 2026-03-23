'use client'

import * as React from 'react'

import { cn } from '../lib/utils'

type DialogContextValue = {
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <>{children}</>
    </DialogContext.Provider>
  )
}

export function DialogContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element | null {
  const context = React.useContext(DialogContext)
  if (!context?.open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => context.onOpenChange(false)}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-lg border p-4',
          'bg-[color:var(--ns-glass-bg-strong)] border-[color:var(--ns-color-border)]',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      />
    </div>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn('mb-2 flex flex-col gap-1', className)} {...props} />
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
  return (
    <h2
      className={cn('text-lg font-semibold text-[color:var(--ns-color-text)]', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return (
    <p
      className={cn('text-sm text-[color:var(--ns-color-muted)]', className)}
      {...props}
    />
  )
}

