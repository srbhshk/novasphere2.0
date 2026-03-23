import type { ReactNode } from 'react'

export function Dialog({ children }: { children: ReactNode }): React.JSX.Element {
  return <div data-testid="dialog">{children}</div>
}

export function DialogContent({ children }: { children: ReactNode }): React.JSX.Element {
  return <div data-testid="dialog-content">{children}</div>
}

export function DialogHeader({ children }: { children: ReactNode }): React.JSX.Element {
  return <div data-testid="dialog-header">{children}</div>
}

export function DialogTitle({ children }: { children: ReactNode }): React.JSX.Element {
  return <div data-testid="dialog-title">{children}</div>
}

export function DialogDescription({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  return <div data-testid="dialog-description">{children}</div>
}
