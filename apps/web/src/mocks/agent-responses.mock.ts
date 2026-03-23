/**
 * Mock responses matching MockAdapter variants.
 * Used when NEXT_PUBLIC_DATA_SOURCE=mock.
 */

export const MOCK_AGENT_RESPONSES = [
  {
    content:
      'I suggest composing the dashboard with MRR, Churn, and Active Users metrics in the top row, followed by the Revenue chart and Pipeline breakdown.',
    toolCalls: [
      {
        toolName: 'render_layout',
        args: {
          cards: [
            { moduleId: 'metric-mrr', colSpan: 4, rowSpan: 1, order: 0, visible: true },
            { moduleId: 'metric-churn', colSpan: 4, rowSpan: 1, order: 1, visible: true },
            { moduleId: 'metric-users', colSpan: 4, rowSpan: 1, order: 2, visible: true },
            {
              moduleId: 'chart-revenue',
              colSpan: 8,
              rowSpan: 2,
              order: 3,
              visible: true,
            },
            {
              moduleId: 'chart-pipeline',
              colSpan: 4,
              rowSpan: 2,
              order: 4,
              visible: true,
            },
          ],
          reasoning: 'Board-level metrics first, then revenue and pipeline.',
        },
      },
    ],
  },
  {
    content:
      'The churn spike correlates with the revenue drop in Q1. The MRR signal suggests we lost several enterprise accounts. Consider reviewing the pipeline stall in the negotiation stage.',
    toolCalls: [],
  },
  {
    content:
      'What would you like me to focus on? Board presentation, daily standup, or investor review?',
    toolCalls: [
      {
        toolName: 'ask_clarification',
        args: {
          question: 'What are you optimising for right now?',
          options: ['Board presentation', 'Daily standup', 'Investor review'],
        },
      },
    ],
  },
  {
    content:
      'MRR is up 12.3% month-over-month. Active accounts grew 8.7%. The pipeline shows 46% in closed stage.',
    toolCalls: [],
  },
  {
    content:
      'Based on your role and the product domain, I recommend focusing on the critical signals: churn rate, MRR, and pipeline health. Would you like me to compose a layout for that?',
    toolCalls: [],
  },
] as const
