import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const ROOT_TARGETS = [
  'node_modules',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.turbo',
]

const WORKSPACE_TARGETS = [
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'coverage',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
]

function removePath(pathToRemove) {
  if (!existsSync(pathToRemove)) return
  rmSync(pathToRemove, { recursive: true, force: true })
  console.log(`removed: ${pathToRemove}`)
}

function cleanDirectory(baseDir, targets) {
  for (const target of targets) {
    removePath(join(baseDir, target))
  }
}

function cleanWorkspaceChildren(groupDir) {
  const absoluteGroupDir = join(root, groupDir)
  if (!existsSync(absoluteGroupDir)) return

  for (const entry of readdirSync(absoluteGroupDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    cleanDirectory(join(absoluteGroupDir, entry.name), WORKSPACE_TARGETS)
  }
}

cleanDirectory(root, ROOT_TARGETS)
cleanWorkspaceChildren('apps')
cleanWorkspaceChildren('packages')

console.log('workspace clean complete')
