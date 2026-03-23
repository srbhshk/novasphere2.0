'use client'

import * as React from 'react'

import { cn } from '../lib/utils'

type PopoverContextValue = {
  open: boolean
  setOpen: (nextOpen: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

export function Popover({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  )
}

export type PopoverTriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean
}

export function PopoverTrigger({
  asChild,
  children,
  ...props
}: PopoverTriggerProps): React.JSX.Element {
  const context = React.useContext(PopoverContext)
  if (!context) {
    return <>{children}</>
  }

  const triggerProps = {
    onClick: () => context.setOpen(!context.open),
    ...props,
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      triggerProps,
    )
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  )
}

export type PopoverContentProps = React.HTMLAttributes<HTMLDivElement>

export function PopoverContent({
  className,
  children,
  ...props
}: PopoverContentProps): React.JSX.Element | null {
  const context = React.useContext(PopoverContext)
  if (!context || !context.open) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute right-0 top-full z-50 mt-2 min-w-48 rounded-md border p-2',
        'bg-[color:var(--ns-glass-bg-strong)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

