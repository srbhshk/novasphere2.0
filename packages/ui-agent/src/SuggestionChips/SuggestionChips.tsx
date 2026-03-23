'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { SuggestionChip } from '@novasphere/agent-core'
import { suggestionVariants } from '../variants'

export type SuggestionChipsProps = {
  chips: SuggestionChip[]
  onSelect: (chip: SuggestionChip) => void
  className?: string
}

export function SuggestionChips({
  chips,
  onSelect,
  className,
}: SuggestionChipsProps): React.JSX.Element | null {
  if (chips.length === 0) return null

  return (
    <div className={className} role="list" aria-label="Suggested actions">
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <AnimatePresence mode="popLayout">
          {chips.map((chip) => (
            <motion.button
              key={chip.id}
              type="button"
              role="listitem"
              variants={suggestionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => onSelect(chip)}
              className="rounded-full border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-3 py-1.5 text-sm text-[var(--ns-color-text)] hover:bg-[var(--ns-glass-bg-medium)] focus:ring-2 focus:ring-[var(--ns-color-accent)]/50 focus:outline-none"
            >
              {chip.label}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
