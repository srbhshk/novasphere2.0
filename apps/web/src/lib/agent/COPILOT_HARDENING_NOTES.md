## Copilot chat — end-to-end flow + trust boundaries

### Dataflow (UI → LLM → UI)

```mermaid
flowchart TD
  CopilotPanel["CopilotPanel (packages/ui-agent)"] -->|onSend(text)| CopilotContext["CopilotChatProvider (apps/web)"]
  CopilotContext -->|useChat(DefaultChatTransport)| ApiAgent["POST /api/agent (apps/web)"]
  ApiAgent -->|buildAgentContext()| AgentContext["AgentContext (apps/web + agent-core types)"]
  ApiAgent -->|novaAgent.stream()| ToolLoop["NovaToolLoopAgent (apps/web)"]
  ToolLoop -->|system prompt builders| AgentCorePrompts["@novasphere/agent-core prompts.ts"]
  ToolLoop -->|streamText + GenUI tools| AiSdk["AI SDK 6"]
  AiSdk -->|UIMessage stream response| CopilotContext
  CopilotContext -->|messages UIMessage[]| DashboardPage["dashboard/page.tsx (apps/web)"]
  DashboardPage -->|extractToolCallsForExecution()| ToolParser["tool-parser.ts (apps/web)"]
  ToolParser -->|executeToolCall()| ToolExecutor["tool-executor.ts (apps/web)"]
  ToolExecutor -->|setLayout()| LayoutStore["layout.store.ts (Zustand)"]
  ToolExecutor -->|setSuggestions()| AgentPanelStore["agent.store.ts (Zustand)"]
  LayoutStore --> BentoGrid["BentoGrid (packages/ui-bento)"]
  AgentPanelStore --> CopilotPanel
```

### Where tool calls come from

- The LLM emits tool parts as `UIMessage.parts[]` with `type: 'tool-[toolName]'` and `state`.
- We **only apply** tools when `state === 'output-available'` via `extractToolCallsForExecution()` so partial tool inputs are never executed.

### Trust boundaries (must be server-canonical)

**Client-supplied (untrusted hints)** sent by `DefaultChatTransport` in `CopilotContext.tsx`:

- `x-user-id`
- `x-user-role`
- `x-tenant-id`
- `x-current-route`

**Server-canonical identity** must be derived from Better Auth session in `POST /api/agent`:

- `userId` (canonical)
- `userRole` (canonical)
- `tenantId` / active org (canonical)

**Rule**: never trust client-provided identity claims for the agent route; overwrite headers before building `AgentContext`.

### UI contract enforcement (current mechanism)

- `buildAgentContext()` computes `uiContract` using `@novasphere/agent-core` `classifyUiIntent()` and `requiresToolForIntent()`.
- `POST /api/agent` wraps the streaming response to detect if tool events appear when `uiContract.requiresTool === true`. It logs `contract_compliant` vs `contract_violation` events.

### Hardening goals (why this doc exists)

- Ensure multi-user + multi-tenant isolation (session-only identity).
- Add DEBUG-gated, full-fidelity observability (stdout-only) for UI→LLM→UI.
- Add an explicit in-domain/off-topic gate so the agent only responds to product-relevant requests.
