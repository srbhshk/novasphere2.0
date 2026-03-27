import { NextResponse } from 'next/server'

import type { AdapterType } from '@novasphere/agent-core'

import { env } from '@/lib/env'

type AgentStatusResponse = {
  adapterType: AdapterType
  adapterModel: string
}

function resolveRuntimeAdapter(): AgentStatusResponse {
  if (env.AI_PROVIDER === 'claude') {
    return { adapterType: 'claude', adapterModel: 'claude-3-5-sonnet-latest' }
  }
  if (env.AI_PROVIDER === 'openai') {
    return { adapterType: 'openai', adapterModel: 'gpt-4o-mini' }
  }
  if (env.AI_PROVIDER === 'ollama') {
    return { adapterType: 'ollama', adapterModel: env.OLLAMA_MODEL }
  }
  return { adapterType: 'ollama', adapterModel: env.OLLAMA_MODEL }
}

export async function GET(): Promise<NextResponse<AgentStatusResponse>> {
  return NextResponse.json(resolveRuntimeAdapter())
}
