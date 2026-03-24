import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../lib/utils'
import './GlassCard.module.css'

export type GlassCardVariant = 'subtle' | 'medium' | 'strong'

export type GlassCardProps = {
  variant?: GlassCardVariant
  highlight?: boolean
  hover?: boolean
  asChild?: boolean
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>

export function GlassCard({
  variant = 'medium',
  highlight = false,
  hover = false,
  asChild = false,
  children,
  className,
  ...rest
}: GlassCardProps) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      className={cn(
        'ns-glass-card',
        `ns-glass-card-${variant}`,
        highlight ? 'ns-glass-card-highlight' : undefined,
        hover ? 'ns-glass-card-hover' : undefined,
        'ns-glass-card-content shadow-2xl',
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  )
}
