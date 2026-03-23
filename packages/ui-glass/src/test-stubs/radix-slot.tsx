import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type SlotProps = ComponentPropsWithoutRef<'div'> & {
  children?: ReactNode
}

export function Slot({ children }: SlotProps) {
  // Minimal test-only implementation: just render a div wrapper.
  return <div>{children}</div>
}
