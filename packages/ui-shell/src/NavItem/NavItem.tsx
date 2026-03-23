import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@novasphere/ui-glass'
import { icons } from 'lucide-react'
import * as React from 'react'

import type { TenantNavItem } from '@novasphere/tenant-core'

import { cn } from '../lib/utils'
import styles from './NavItem.module.css'

type IconComponentType = React.ComponentType<{
  className?: string
  size?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}>

export type NavItemProps = {
  item: TenantNavItem
  isActive: boolean
  isCollapsed?: boolean
  onClick?: () => void
}

function FallbackIcon({
  className,
  size = 18,
  ...rest
}: {
  className?: string
  size?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}): React.JSX.Element {
  return (
    <svg
      {...rest}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      width={size}
      height={size}
    >
      <circle cx="12" cy="12" r="7" />
    </svg>
  )
}

function getIconByName(iconName: string): IconComponentType {
  const possibleIcon = (icons as unknown as Record<string, unknown>)[iconName]

  if (typeof possibleIcon === 'function') {
    return possibleIcon as IconComponentType
  }

  return FallbackIcon
}

export default function NavItem({
  item,
  isActive,
  isCollapsed = false,
  onClick,
}: NavItemProps): React.JSX.Element {
  const IconComponent = getIconByName(item.icon)

  const anchor = (
    <a
      className={cn(styles.item, isActive ? styles.active : null)}
      href={item.href}
      onClick={(event) => {
        if (!onClick) {
          return
        }

        event.preventDefault()
        onClick()
      }}
    >
      <IconComponent aria-hidden="true" size={18} />
      {!isCollapsed ? <span className={styles.label}>{item.label}</span> : null}
      {item.badge ? (
        <span className={styles.badge}>
          <Badge variant="secondary">{item.badge}</Badge>
        </span>
      ) : null}
    </a>
  )

  if (!isCollapsed) {
    return anchor
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{anchor}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
