import { THEME_PRESETS, type ThemePreset } from '@novasphere/tokens'

export const THEME_COOKIE_NAME = 'ns-theme'
export const THEME_STORAGE_KEY = 'novasphere-theme'

export function isValidThemePreset(value: unknown): value is ThemePreset {
  return typeof value === 'string' && value in THEME_PRESETS
}

export const THEME_PRESET_ORDER: ThemePreset[] = [
  'midnight-bloom',
  'forest-ember',
  'arctic-signal',
  'obsidian-gold',
]
