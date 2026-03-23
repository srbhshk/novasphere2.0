import { copyFile, mkdir } from 'fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  async onSuccess() {
    await mkdir('dist/themes', { recursive: true })
    await copyFile('src/tokens.css', 'dist/tokens.css')
    await copyFile('src/themes/midnight-bloom.css', 'dist/themes/midnight-bloom.css')
    await copyFile('src/themes/forest-ember.css', 'dist/themes/forest-ember.css')
    await copyFile('src/themes/arctic-signal.css', 'dist/themes/arctic-signal.css')
    await copyFile('src/themes/obsidian-gold.css', 'dist/themes/obsidian-gold.css')
  },
})
