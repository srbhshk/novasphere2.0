import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  external: ['react', 'react-dom', '@novasphere/tokens', '@radix-ui/react-slot'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
