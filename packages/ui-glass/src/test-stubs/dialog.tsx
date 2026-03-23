import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type DialogBaseProps = {
  children?: ReactNode
}

export type DialogProps = DialogBaseProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Dialog({ children, onOpenChange }: DialogProps) {
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false)
    }
  }

  return (
    <div data-testid="dialog-root" onClick={handleClick}>
      {children}
    </div>
  )
}

export type DialogContentProps = ComponentPropsWithoutRef<'div'>

export function DialogContent(props: DialogContentProps) {
  return <div data-testid="dialog-content">{props.children}</div>
}

export type DialogHeaderProps = ComponentPropsWithoutRef<'div'>

export function DialogHeader(props: DialogHeaderProps) {
  return <div data-testid="dialog-header">{props.children}</div>
}

export type DialogTitleProps = ComponentPropsWithoutRef<'h2'>

export function DialogTitle(props: DialogTitleProps) {
  return <h2 data-testid="dialog-title">{props.children}</h2>
}

export type DialogDescriptionProps = ComponentPropsWithoutRef<'p'>

export function DialogDescription(props: DialogDescriptionProps) {
  return <p data-testid="dialog-description">{props.children}</p>
}
