import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function listViolations(): string[] {
  const root = join(process.cwd(), 'src')
  const violations: string[] = []

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        // Allow mocks usage inside API routes only.
        if (fullPath.startsWith(join(root, 'app', 'api'))) {
          continue
        }
        walk(fullPath)
        continue
      }

      if (!entry.isFile()) continue
      if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) continue
      if (fullPath.endsWith(join('src', 'lib', 'mock-boundary.test.ts'))) continue
      // Skip typecheck/lint noise: don't read enormous files if any.
      const st = statSync(fullPath)
      if (st.size > 2_000_000) continue

      const content = readFileSync(fullPath, 'utf8')
      const importsMocks =
        content.includes("from '@/mocks/") ||
        content.includes('from "@/mocks/') ||
        content.includes("import '@/mocks/") ||
        content.includes('import "@/mocks/')
      if (importsMocks) {
        const rel = fullPath.slice(process.cwd().length + 1)
        violations.push(rel)
      }
    }
  }

  walk(root)
  return violations.sort()
}

describe('mock boundary', () => {
  it('prevents UI code from importing mocks', () => {
    const violations = listViolations()
    expect(violations).toEqual([])
  })
})
