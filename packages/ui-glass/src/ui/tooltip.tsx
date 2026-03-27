'use client'

import * as React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

import { cn } from '../lib/utils'

export function TooltipProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <RadixTooltip.Provider>{children}</RadixTooltip.Provider>
}

export function Tooltip({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <RadixTooltip.Root>{children}</RadixTooltip.Root>
}

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<
  typeof RadixTooltip.Trigger
>

export function TooltipTrigger({
  children,
  ...props
}: TooltipTriggerProps): React.JSX.Element {
  return <RadixTooltip.Trigger {...props}>{children}</RadixTooltip.Trigger>
}

export type TooltipContentProps = React.ComponentPropsWithoutRef<
  typeof RadixTooltip.Content
> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function TooltipContent({
  className,
  children,
  side = 'top',
  ...props
}: TooltipContentProps): React.JSX.Element | null {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={8}
        className={cn(
          'z-50 rounded-md border px-2 py-1 text-xs shadow-lg',
          'bg-[color:var(--ns-glass-bg-strong)] text-[color:var(--ns-color-text)] border-[color:var(--ns-color-border)]',
          className,
        )}
        {...props}
      >
        {children}
        <RadixTooltip.Arrow className="fill-[color:var(--ns-glass-bg-strong)]" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  )
}

