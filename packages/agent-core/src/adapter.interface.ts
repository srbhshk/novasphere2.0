import type { AdapterType, AgentMessage, AgentResponse, AgentStatus } from './agent.types'
import type { AgentContext } from './context.types'

export type OnToken = (token: string) => void

export type AdapterChatParams = {
  messages: AgentMessage[]
  context: AgentContext
}

export interface AgentAdapter {
  readonly type: AdapterType
  readonly modelName: string

  init(): Promise<void>
  chat(params: AdapterChatParams): Promise<AgentResponse>
  streamChat(params: AdapterChatParams, onToken: OnToken): Promise<AgentResponse>
  getStatus(): AgentStatus
  destroy(): Promise<void>
}
