import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const uiGlassSrc = resolve(fileURLToPath(new URL('../ui-glass/src', import.meta.url)))

export default defineConfig({
  resolve: {
    alias: {
      '@': uiGlassSrc,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
