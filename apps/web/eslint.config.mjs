import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
/** @type {import('eslint').Linter.Config[]} */
const next = require('eslint-config-next')

export default [
  ...next,
  {
    name: 'novasphere/web',
    files: ['src/**/*.{ts,tsx}', 'proxy.ts'],
    ignores: ['next-env.d.ts', '.next/**'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
    rules: { 'no-console': 'off' },
  },
]
