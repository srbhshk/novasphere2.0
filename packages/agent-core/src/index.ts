export {
  ADAPTER_TYPE,
  AGENT_STATUS,
  TENANT_PLAN,
  UI_CONTRACT_FALLBACK,
  UI_CONTRACT_STATUS,
  UI_INTENT,
  USER_ROLE,
} from './agent.types'
export type {
  ActivityEvent,
  ActivitySeverity,
  AdapterType,
  AgentMessage,
  AgentMessageRole,
  AgentResponse,
  AgentStatus,
  AgentToolCall,
  ComponentSpec,
  MetricDeltaDirection,
  MetricSnapshot,
  SuggestionChip,
  TenantPlan,
  UiActionContractDecision,
  UiActionContractResult,
  UiContractFallback,
  UiContractStatus,
  UiIntent,
  UserPreferences,
  UserRole,
} from './agent.types'

export type { AgentContext, BentoCardConfig } from './context.types'
export type { ProductConfig, RoleContext } from './product.types'

export {
  AgentCapabilityError,
  AgentError,
  AgentNetworkError,
  AgentNotReachableError,
  AgentParseError,
  AgentTimeoutError,
  WebGPUNotSupportedError,
} from './agent.errors'

export type { AgentAdapter } from './adapter.interface'
export { createAdapter, isServerSide } from './adapter.factory'

export {
  allowedFallbackForIntent,
  buildSignalExplainAndRefinePrompt,
  buildInitialLayoutRoleHint,
  buildToolLoopInstructions,
  classifyUiIntent,
  getAnomalyPrompt,
  getIntentPrompt,
  getLayoutPrompt,
  requiresToolForIntent,
  getSystemPrompt,
  PROMPTS,
} from './prompts'
