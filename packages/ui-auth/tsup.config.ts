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
    'react-hook-form',
    'zod',
    '@hookform/resolvers',
    '@novasphere/tokens',
    '@novasphere/ui-glass',
    '@novasphere/tenant-core',
    'lucide-react',
    '@radix-ui/react-popover',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
