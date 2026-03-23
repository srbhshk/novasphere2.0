export const THEME_PRESETS = {
  'midnight-bloom': {
    name: 'Midnight Bloom',
    description: 'Deep navy, warm gold, soft rose',
    accentHex: '#F7D794',
    bgHex: '#192A56',
  },
  'forest-ember': {
    name: 'Forest Ember',
    description: 'Deep forest, warm linen, terra cotta',
    accentHex: '#E27D60',
    bgHex: '#2D4F1E',
  },
  'arctic-signal': {
    name: 'Arctic Signal',
    description: 'Electric blue, cobalt, aqua teal',
    accentHex: '#0984E3',
    bgHex: '#060D1A',
  },
  'obsidian-gold': {
    name: 'Obsidian Gold',
    description: 'Graphite, mist silver, antique gold',
    accentHex: '#D3B037',
    bgHex: '#2D3436',
  },
} as const

export type ThemePreset = keyof typeof THEME_PRESETS
