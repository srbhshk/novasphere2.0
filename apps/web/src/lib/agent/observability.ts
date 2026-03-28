/**
 * Agent logging — stdout JSON lines when `process.stdout` exists (server).
 * Client-imported paths (e.g. tool-executor) no-op here.
 */
export function writeAgentLog(payload: Record<string, unknown>): void {
  if (typeof process === 'undefined' || process.stdout == null) {
    return
  }
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}
