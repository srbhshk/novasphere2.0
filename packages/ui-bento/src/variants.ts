import type { Variants } from 'framer-motion'

export const bentoCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
  dragging: {
    scale: 1.02,
  },
} as const

export const bentoGridVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
} as const
