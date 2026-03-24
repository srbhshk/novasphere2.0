'use client'

import type { ReactNode } from 'react'

type ModuleWrapperProps = {
  title?: string | undefined
  children: ReactNode
  className?: string | undefined
}

export function ModuleWrapper({
  title,
  children,
  className,
}: ModuleWrapperProps): React.JSX.Element {
  return (
    <div className={`flex h-full flex-col gap-2 ${className ?? ''}`}>
      {title ? (
        <div className="shrink-0 text-xs font-semibold tracking-widest text-[var(--ns-color-muted)] uppercase">
          {title}
        </div>
      ) : null}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
