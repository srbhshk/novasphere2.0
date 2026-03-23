import { THEME_PRESETS, type ThemePreset } from './presets'

export { THEME_PRESETS, type ThemePreset }

export const BLUR = {
  SM: 'var(--ns-blur-sm)',
  MD: 'var(--ns-blur-md)',
  LG: 'var(--ns-blur-lg)',
} as const

export const RADIUS = {
  SM: 'var(--ns-radius-sm)',
  MD: 'var(--ns-radius-md)',
  LG: 'var(--ns-radius-lg)',
  XL: 'var(--ns-radius-xl)',
} as const

export const MOTION = {
  EASE_SPRING: 'var(--ns-ease-spring)',
  EASE_SMOOTH: 'var(--ns-ease-smooth)',
  EASE_OUT: 'var(--ns-ease-out)',
  DURATION_FAST: 'var(--ns-duration-fast)',
  DURATION_BASE: 'var(--ns-duration-base)',
  DURATION_SLOW: 'var(--ns-duration-slow)',
} as const

export const NOISE = {
  OPACITY: 'var(--ns-noise-opacity)',
} as const
