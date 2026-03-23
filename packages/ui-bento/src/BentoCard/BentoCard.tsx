import type { PropsWithChildren } from 'react'
import { memo } from 'react'
import { GripVertical } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import type { BentoCardConfig } from '../bento.types'

export type BentoCardProps = PropsWithChildren<{
  config: BentoCardConfig
  isDragging?: boolean
  dragHandleProps?: {
    onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void
    'aria-label'?: string
  }
  className?: string
}>

export const BentoCard = memo(function BentoCard({
  config,
  isDragging = false,
  dragHandleProps,
  className,
  children,
}: BentoCardProps) {
  return (
    <GlassCard
      variant="medium"
      hover
      className={[
        'relative flex h-full flex-col gap-3 p-4',
        isDragging ? 'bentoCardDragging' : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        {config.title ? (
          <div className="text-sm font-medium text-[color:var(--ns-color-text)]">
            {config.title}
          </div>
        ) : (
          <div />
        )}
        {dragHandleProps ? (
          <button
            type="button"
            className="bentoDragHandle inline-flex items-center justify-center rounded-full p-1 text-[color:var(--ns-color-muted)] hover:text-[color:var(--ns-color-text)]"
            {...dragHandleProps}
          >
            <GripVertical className="h-3 w-3" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </GlassCard>
  )
})
