import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@novasphere/ui-glass'
import {
  BarChart3,
  Bot,
  Circle,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Settings,
  Settings2,
} from 'lucide-react'
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
  return <Circle {...rest} className={className} size={size} />
}

function getIconByName(iconName: string): IconComponentType {
  const name = iconName.trim()

  const iconMap: Record<string, IconComponentType> = {
    LayoutDashboard,
    LineChart,
    BarChart3,
    GitBranch,
    Bot,
    Settings,
    Settings2,
  }

  return iconMap[name] ?? FallbackIcon
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
