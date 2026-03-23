import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uiGlassSrc = path.resolve(__dirname, '../ui-glass/src')

export default defineConfig({
  resolve: {
    alias: {
      '@novasphere/ui-glass': path.resolve(uiGlassSrc, 'index.ts'),
      '@/ui/dialog': path.resolve(__dirname, 'src/test-stubs/dialog.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        inline: ['@novasphere/ui-glass'],
      },
    },
  },
})
