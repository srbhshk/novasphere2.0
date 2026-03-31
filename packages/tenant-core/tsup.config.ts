import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/breadcrumbs.ts', 'src/tenant.types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'node20',
  external: ['@novasphere/db'],
  outExtension({ format }) {
    return format === 'cjs' ? { js: '.cjs' } : { js: '.js' }
  },
})
