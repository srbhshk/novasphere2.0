'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import type { MotionStyle } from 'framer-motion'
import { Reorder, motion } from 'framer-motion'
import type {
  BentoCardConfig,
  BentoLayoutConfig,
  BentoModuleRegistry,
} from '../bento.types'
import { BentoCard } from '../BentoCard/BentoCard'
import { BentoPlaceholder } from '../BentoPlaceholder/BentoPlaceholder'
import { bentoCardVariants, bentoGridVariants } from '../variants'

export type BentoGridProps = {
  layout: BentoLayoutConfig
  modules: BentoModuleRegistry
  onReorder?: (nextLayout: BentoLayoutConfig) => void
  className?: string
}

export const BentoGrid = memo(function BentoGrid({
  layout,
  modules,
  onReorder,
  className,
}: BentoGridProps) {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const update = (): void => setIsCompact(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => {
      mql.removeEventListener('change', update)
    }
  }, [])

  const visibleCards = useMemo(
    () => layout.filter((card) => card.visible).sort((a, b) => a.order - b.order),
    [layout],
  )

  const gridStyle: MotionStyle = {
    display: 'grid',
    gridTemplateColumns: isCompact
      ? 'repeat(1, minmax(0, 1fr))'
      : 'repeat(12, minmax(0, 1fr))',
    gridAutoFlow: 'row dense',
    gridAutoRows: 'minmax(160px, auto)',
    gap: '16px',
    width: '100%',
  }

  return (
    <>
      {onReorder ? (
        <Reorder.Group
          axis="y"
          values={visibleCards}
          onReorder={(next: BentoCardConfig[]) => {
            const updated: BentoLayoutConfig = next.map((card, index) => ({
              ...card,
              order: index,
            }))
            onReorder(updated)
          }}
          className={className}
          style={gridStyle}
        >
          {visibleCards.map((card) => {
            const Module = modules[card.moduleId]
            const content = Module ? (
              <Module config={card} />
            ) : (
              <BentoPlaceholder moduleId={card.moduleId} />
            )

            const colSpan = isCompact ? 12 : card.colSpan
            return (
              <Reorder.Item
                key={card.id}
                as="div"
                value={card}
                variants={bentoCardVariants}
                whileDrag="dragging"
                layout
                style={{
                  gridColumn: `span ${colSpan} / span ${colSpan}`,
                  gridRow: `span ${card.rowSpan} / span ${card.rowSpan}`,
                }}
              >
                <BentoCard config={card} isDragging={false}>
                  {content}
                </BentoCard>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      ) : (
        <motion.div
          variants={bentoGridVariants}
          initial="initial"
          animate="animate"
          className={className}
          style={gridStyle}
        >
          {visibleCards.map((card) => {
            const Module = modules[card.moduleId]
            const content = Module ? (
              <Module config={card} />
            ) : (
              <BentoPlaceholder moduleId={card.moduleId} />
            )

            const colSpan = isCompact ? 12 : card.colSpan
            return (
              <motion.div
                key={card.id}
                variants={bentoCardVariants}
                whileDrag="dragging"
                layout
                style={{
                  gridColumn: `span ${colSpan} / span ${colSpan}`,
                  gridRow: `span ${card.rowSpan} / span ${card.rowSpan}`,
                }}
              >
                <BentoCard config={card} isDragging={false}>
                  {content}
                </BentoCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </>
  )
})
