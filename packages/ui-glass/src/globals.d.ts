declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '@radix-ui/react-slot' {
  import type { ComponentPropsWithoutRef, ComponentType } from 'react'

  export const Slot: ComponentType<ComponentPropsWithoutRef<'div'>>
}

declare module '@/ui/dialog' {
  import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react'

  export const Dialog: ComponentType<{
    open: boolean
    onOpenChange: (open: boolean) => void
    children?: ReactNode
  }>

  export const DialogContent: ComponentType<ComponentPropsWithoutRef<'div'>>

  export const DialogHeader: ComponentType<ComponentPropsWithoutRef<'div'>>

  export const DialogTitle: ComponentType<ComponentPropsWithoutRef<'h2'>>

  export const DialogDescription: ComponentType<ComponentPropsWithoutRef<'p'>>
}
