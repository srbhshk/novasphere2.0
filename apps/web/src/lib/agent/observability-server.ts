import 'server-only'

import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { writeAgentLog } from '@/lib/agent/observability'

/**
 * Writes one JSON log line to stdout and optionally appends to `AGENT_LOG_JSONL_PATH`.
 */
export function writeAgentLogWithFileSink(payload: Record<string, unknown>): void {
  writeAgentLog(payload)

  const sinkPath = process.env['AGENT_LOG_JSONL_PATH']
  if (typeof sinkPath !== 'string' || sinkPath.length === 0) {
    return
  }

  const line = `${JSON.stringify(payload)}\n`
  try {
    mkdirSync(dirname(sinkPath), { recursive: true })
    appendFileSync(sinkPath, line)
  } catch {
    // Sink failures must not break agent requests.
  }
}
