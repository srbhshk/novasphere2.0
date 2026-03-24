export const THEME_PRESETS = {
  'nova-dark': {
    name: 'Nova Dark',
    description: 'Primary futuristic dark theme (recommended default)',
    accentHex: '#36C2FF',
    bgHex: '#050B16',
  },
  'nova-light': {
    name: 'Nova Light',
    description: 'High-contrast light companion for daytime workflows',
    accentHex: '#0E7CFF',
    bgHex: '#F4F8FF',
  },
  'midnight-bloom': {
    name: 'Midnight Bloom',
    description: 'Legacy preset mapped to Nova Dark',
    accentHex: '#36C2FF',
    bgHex: '#050B16',
  },
  'forest-ember': {
    name: 'Forest Ember',
    description: 'Legacy preset mapped to Nova Light',
    accentHex: '#0E7CFF',
    bgHex: '#F4F8FF',
  },
  'arctic-signal': {
    name: 'Arctic Signal',
    description: 'Legacy preset mapped to Nova Dark',
    accentHex: '#36C2FF',
    bgHex: '#050B16',
  },
  'obsidian-gold': {
    name: 'Obsidian Gold',
    description: 'Legacy preset mapped to Nova Dark',
    accentHex: '#36C2FF',
    bgHex: '#050B16',
  },
} as const

export type ThemePreset = keyof typeof THEME_PRESETS

export const THEME_PRESET_CANONICAL: Record<ThemePreset, 'nova-dark' | 'nova-light'> = {
  'nova-dark': 'nova-dark',
  'nova-light': 'nova-light',
  'midnight-bloom': 'nova-dark',
  'forest-ember': 'nova-light',
  'arctic-signal': 'nova-dark',
  'obsidian-gold': 'nova-dark',
}
