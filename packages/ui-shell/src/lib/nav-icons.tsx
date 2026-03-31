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
import type * as React from 'react'

export type NavIconComponentType = React.ComponentType<{
  className?: string
  size?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}>

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

export function getNavIconByName(iconName: string): NavIconComponentType {
  const name = iconName.trim()

  const iconMap: Record<string, NavIconComponentType> = {
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
