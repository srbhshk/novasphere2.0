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
import './NavItem.module.css'

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

  const link = (
    <a
      className={cn('ns-nav-item', isActive ? 'ns-nav-item--active' : undefined)}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={(event) => {
        if (!onClick) {
          return
        }

        event.preventDefault()
        onClick()
      }}
    >
      <IconComponent aria-hidden="true" size={18} />
      {!isCollapsed ? <span className="ns-nav-label">{item.label}</span> : null}
      {item.badge ? (
        <span className="ns-nav-badge">
          <Badge variant="secondary">{item.badge}</Badge>
        </span>
      ) : null}
    </a>
  )

  if (!isCollapsed) {
    return <div className="ns-nav-perspective">{link}</div>
  }

  return (
    <div className="ns-nav-perspective">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
