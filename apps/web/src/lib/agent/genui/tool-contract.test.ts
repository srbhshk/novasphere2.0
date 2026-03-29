import { describe, expect, it } from 'vitest'
import { genUiTools, toolInputSchemas } from './tools'

describe('GenUI tool contract', () => {
  it('registers the same tool names on definitions and Zod schemas', () => {
    const toolKeys = Object.keys(genUiTools).sort()
    const schemaKeys = Object.keys(toolInputSchemas).sort()
    expect(toolKeys).toEqual(schemaKeys)
  })
})
