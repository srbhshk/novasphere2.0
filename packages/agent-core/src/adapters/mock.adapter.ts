import { AGENT_STATUS } from '../agent.types'
import type {
  AgentMessage,
  AgentResponse,
  AgentStatus,
  ComponentSpec,
} from '../agent.types'
import type { AgentAdapter, AdapterChatParams, OnToken } from '../adapter.interface'

type MockAdapterConfig = {
  onStatusChange?: (status: AgentStatus) => void
}

const now = (): number => Date.now()
const createId = (): string => `${now()}-${Math.random().toString(16).slice(2)}`

const layoutVariant = (productName: string): string => {
  const cards: ComponentSpec[] = [
    {
      moduleId: 'metric-mrr',
      colSpan: 3,
      rowSpan: 1,
      title: 'MRR',
      visible: true,
      order: 1,
      config: {},
    },
    {
      moduleId: 'metric-churn',
      colSpan: 3,
      rowSpan: 1,
      title: 'Churn',
      visible: true,
      order: 2,
      config: {},
    },
    {
      moduleId: 'chart-revenue',
      colSpan: 6,
      rowSpan: 2,
      title: 'Revenue',
      visible: true,
      order: 3,
      config: { variant: 'default' },
    },
    {
      moduleId: 'activity-feed',
      colSpan: 12,
      rowSpan: 1,
      title: 'Recent activity',
      visible: true,
      order: 4,
      config: {},
    },
  ]

  return [
    `Here’s a suggested layout for ${productName}.`,
    '```json',
    JSON.stringify({ cards }, null, 2),
    '```',
  ].join('\n')
}

const anomalyVariant = (productDomain: string): string => {
  return [
    `I’m seeing an anomaly pattern consistent with downstream propagation in ${productDomain}.`,
    '- Primary signal moved first; correlated signals followed within a short window.',
    '- Most likely cause: an upstream input change or a shared dependency regression.',
    'Hypothesis: investigate the highest-leverage shared dependency and compare pre/post deploy traces.',
    'Confidence: medium.',
  ].join('\n')
}

const clarificationVariant = (): string => {
  return [
    'Before I change anything, what are you optimizing for?',
    '- Board presentation',
    '- Daily standup',
    '- Investor review',
  ].join('\n')
}

const metricExplainVariant = (productName: string): string => {
  return [
    `For ${productName}, this metric is best interpreted as a leading indicator.`,
    'If the delta is recent, validate seasonality and cohort mix before reacting.',
  ].join('\n')
}

const generalVariant = (roleInProduct: string): string => {
  return [
    `I can tailor the dashboard to your role: ${roleInProduct}.`,
    'Tell me what outcome you need (e.g. “reduce churn risk” or “stabilize latency”), and I’ll re-compose the layout.',
  ].join('\n')
}

export class MockAdapter implements AgentAdapter {
  public readonly type = 'mock' as const
  public readonly modelName = 'mock'

  private status: AgentStatus = AGENT_STATUS.idle
  private readonly onStatusChange: ((status: AgentStatus) => void) | undefined
  private variantIndex = 0

  public constructor(config: MockAdapterConfig = {}) {
    this.onStatusChange = config.onStatusChange
  }

  private setStatus(next: AgentStatus): void {
    this.status = next
    this.onStatusChange?.(next)
  }

  public getStatus(): AgentStatus {
    return this.status
  }

  public async init(): Promise<void> {
    this.setStatus(AGENT_STATUS.idle)
  }

  private nextContent(params: AdapterChatParams): string {
    const context = params.context
    const variants: string[] = [
      layoutVariant(context.productName),
      anomalyVariant(context.productDomain),
      clarificationVariant(),
      metricExplainVariant(context.productName),
      generalVariant(context.roleInProduct),
    ]

    const content = variants[this.variantIndex % variants.length] ?? variants[0]!
    this.variantIndex += 1
    return content
  }

  public async chat(params: AdapterChatParams): Promise<AgentResponse> {
    this.setStatus(AGENT_STATUS.thinking)
    const content = this.nextContent(params)
    await new Promise<void>((resolve) => setTimeout(resolve, 400))

    const message: AgentMessage = {
      id: createId(),
      role: 'assistant',
      content,
      timestamp: now(),
    }

    this.setStatus(AGENT_STATUS.idle)
    return { message, toolCalls: [], isStreaming: false, done: true }
  }

  public async streamChat(
    params: AdapterChatParams,
    onToken: OnToken,
  ): Promise<AgentResponse> {
    this.setStatus(AGENT_STATUS.streaming)
    const content = this.nextContent(params)
    const words = content.split(/\s+/).filter((w) => w.length > 0)

    let out = ''
    for (const word of words) {
      const token = out.length === 0 ? word : ` ${word}`
      out += token
      onToken(token)
      await new Promise<void>((resolve) => setTimeout(resolve, 60))
    }

    const message: AgentMessage = {
      id: createId(),
      role: 'assistant',
      content: out,
      timestamp: now(),
    }

    this.setStatus(AGENT_STATUS.idle)
    return { message, toolCalls: [], isStreaming: true, done: true }
  }

  public async destroy(): Promise<void> {
    this.setStatus(AGENT_STATUS.idle)
  }
}
