import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  external: [
    'react',
    'react-dom',
    'framer-motion',
    'zustand',
    'lucide-react',
    '@radix-ui/react-popover',
    '@novasphere/tokens',
    '@novasphere/ui-glass',
    '@novasphere/agent-core',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
