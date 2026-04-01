import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'node20',
  // Production/enterprise hardening:
  // Bundle node_modules so @novasphere/db remains deployable even in runtimes
  // that do not install workspace transitive deps (common with standalone outputs).
  skipNodeModulesBundle: false,
  outExtension({ format }) {
    return format === 'cjs' ? { js: '.cjs' } : { js: '.js' }
  },
})
