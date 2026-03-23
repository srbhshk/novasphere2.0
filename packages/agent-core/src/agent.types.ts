export const ADAPTER_TYPE = {
  ollama: 'ollama',
  claude: 'claude',
  openai: 'openai',
  mock: 'mock',
} as const

export type AdapterType = (typeof ADAPTER_TYPE)[keyof typeof ADAPTER_TYPE]

export const AGENT_STATUS = {
  idle: 'idle',
  checking: 'checking',
  thinking: 'thinking',
  streaming: 'streaming',
  downloading: 'downloading',
  error: 'error',
} as const

export type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS]

export const USER_ROLE = {
  admin: 'admin',
  ceo: 'ceo',
  engineer: 'engineer',
  viewer: 'viewer',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const TENANT_PLAN = {
  free: 'free',
  pro: 'pro',
  enterprise: 'enterprise',
} as const

export type TenantPlan = (typeof TENANT_PLAN)[keyof typeof TENANT_PLAN]

export type AgentMessageRole = 'user' | 'assistant' | 'system'

export type AgentToolCall = {
  id: string
  toolName: string
  args: Record<string, unknown>
  result?: unknown
}

export type AgentMessage = {
  id: string
  role: AgentMessageRole
  content: string
  timestamp: number
  toolCalls?: AgentToolCall[]
}

export type AgentResponse = {
  message: AgentMessage
  toolCalls: AgentToolCall[]
  isStreaming: boolean
  done: boolean
}

export type SuggestionChip = {
  id: string
  label: string
  action: string
}

export type ComponentSpec = {
  moduleId: string
  colSpan: number
  rowSpan: number
  config: Record<string, unknown>
  title?: string
  visible: boolean
  order: number
}

export type UserPreferences = {
  defaultRole?: UserRole
  dashboardGoal?: string
  pinnedModuleIds?: string[]
  hiddenModuleIds?: string[]
  aiPersona?: string
  /** Named theme preset id (matches THEME_PRESETS keys in @novasphere/tokens). */
  themePreset?: string
}

export type MetricDeltaDirection = 'up' | 'down' | 'flat'

export type MetricSnapshot = {
  id: string
  label: string
  value: number
  delta: number
  deltaDirection: MetricDeltaDirection
  unit?: string
}

export type ActivitySeverity = 'info' | 'warning' | 'error'

export type ActivityEvent = {
  id: string
  type: string
  message: string
  timestamp: number
  severity?: ActivitySeverity
}
