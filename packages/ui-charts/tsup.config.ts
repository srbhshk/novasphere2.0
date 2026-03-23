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
    'recharts',
    'lucide-react',
    '@novasphere/tokens',
    '@novasphere/ui-glass',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
