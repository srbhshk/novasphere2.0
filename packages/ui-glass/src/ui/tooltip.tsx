'use client'

import * as React from 'react'

import { cn } from '../lib/utils'

type TooltipContextValue = {
  open: boolean
  setOpen: (nextOpen: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

export function TooltipProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <>{children}</>
}

export function Tooltip({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  )
}

export type TooltipTriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean
}

export function TooltipTrigger({
  asChild,
  children,
  ...props
}: TooltipTriggerProps): React.JSX.Element {
  const context = React.useContext(TooltipContext)
  if (!context) {
    return <>{children}</>
  }

  const triggerProps = {
    onMouseEnter: () => context.setOpen(true),
    onMouseLeave: () => context.setOpen(false),
    onFocus: () => context.setOpen(true),
    onBlur: () => context.setOpen(false),
    ...props,
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      triggerProps,
    )
  }

  return (
    <span {...triggerProps} role="button" tabIndex={0}>
      {children}
    </span>
  )
}

export type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function TooltipContent({
  className,
  children,
  ...props
}: TooltipContentProps): React.JSX.Element | null {
  const context = React.useContext(TooltipContext)
  if (!context || !context.open) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md border px-2 py-1 text-xs',
        'bg-[color:var(--ns-glass-bg-strong)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

