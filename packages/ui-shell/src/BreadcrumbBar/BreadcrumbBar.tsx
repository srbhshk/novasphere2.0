import { ChevronRight } from 'lucide-react'
import * as React from 'react'

import type { BreadcrumbItem } from '@novasphere/tenant-core'

export type BreadcrumbBarProps = {
  items: BreadcrumbItem[]
}

export default function BreadcrumbBar({ items }: BreadcrumbBarProps): React.JSX.Element {
  if (items.length === 0) {
    return <div />
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.href}-${item.label}`} className="flex min-w-0 items-center">
              {isLast ? (
                <span className="truncate text-[color:var(--ns-color-text)]">
                  {item.label}
                </span>
              ) : (
                <a
                  className="max-w-[40vw] truncate text-[color:var(--ns-color-muted)] transition-colors hover:text-[color:var(--ns-color-text)] sm:max-w-none"
                  href={item.href}
                >
                  {item.label}
                </a>
              )}
              {!isLast ? (
                <ChevronRight
                  aria-hidden="true"
                  className="ml-2 text-[color:var(--ns-color-muted)]"
                  size={16}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
