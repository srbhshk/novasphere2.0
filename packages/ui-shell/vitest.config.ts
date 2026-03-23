import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@novasphere/ui-glass': path.resolve(__dirname, '../ui-glass/src/index.ts'),
      '@/ui/dialog': path.resolve(__dirname, '../ui-glass/src/test-stubs/dialog.tsx'),
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
