export function writeAgentLog(payload: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}
