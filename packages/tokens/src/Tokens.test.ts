import { BLUR, MOTION, NOISE, RADIUS, THEME_PRESETS } from './index'

describe('@novasphere/tokens exports', () => {
  it('exposes blur radius tokens as CSS variable references', () => {
    expect(BLUR.SM).toBe('var(--ns-blur-sm)')
    expect(BLUR.MD).toBe('var(--ns-blur-md)')
    expect(BLUR.LG).toBe('var(--ns-blur-lg)')
  })

  it('exposes radius tokens as CSS variable references', () => {
    expect(RADIUS.SM).toBe('var(--ns-radius-sm)')
    expect(RADIUS.MD).toBe('var(--ns-radius-md)')
    expect(RADIUS.LG).toBe('var(--ns-radius-lg)')
    expect(RADIUS.XL).toBe('var(--ns-radius-xl)')
  })

  it('exposes motion tokens as CSS variable references', () => {
    expect(MOTION.EASE_SPRING).toBe('var(--ns-ease-spring)')
    expect(MOTION.EASE_SMOOTH).toBe('var(--ns-ease-smooth)')
    expect(MOTION.EASE_OUT).toBe('var(--ns-ease-out)')
    expect(MOTION.DURATION_FAST).toBe('var(--ns-duration-fast)')
    expect(MOTION.DURATION_BASE).toBe('var(--ns-duration-base)')
    expect(MOTION.DURATION_SLOW).toBe('var(--ns-duration-slow)')
  })

  it('exposes noise tokens as CSS variable references', () => {
    expect(NOISE.OPACITY).toBe('var(--ns-noise-opacity)')
  })

  it('includes at least one named theme preset with metadata', () => {
    const entries = Object.entries(THEME_PRESETS)
    expect(entries.length).toBeGreaterThan(0)

    for (const [, preset] of entries) {
      expect(typeof preset.name).toBe('string')
      expect(preset.name.length).toBeGreaterThan(0)
      expect(typeof preset.description).toBe('string')
      expect(preset.description.length).toBeGreaterThan(0)
    }
  })
})
