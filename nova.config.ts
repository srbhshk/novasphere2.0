// novasphere — nova.config.ts
// =============================================================
// This file defines what product novasphere is deployed as.
// The product block is injected into every LLM call — it is
// what makes the AI domain-aware instead of generic.
//
// To deploy novasphere for your product:
//   1. Replace the product block with your domain details
//   2. Set roleContext for what each role cares about HERE
//   3. The LLM will use this context on every interaction
//
// Performance: this is a static import — zero extra latency.
// =============================================================

export const novaConfig = {
  product: {
    // The name of the product this dashboard is deployed in
    name: 'Novasphere Demo',

    // Short domain identifier — used to select terminology
    // Examples: 'infrastructure' | 'fintech' | 'healthcare' | 'saas'
    domain: 'saas-analytics',

    // One sentence injected into the agent's system prompt
    description:
      'A SaaS analytics dashboard tracking revenue growth, churn, and pipeline health',

    // What this product measures — agent uses these as context signals
    primaryMetrics: ['mrr', 'churn_rate', 'active_users', 'pipeline_value'],

    // Triggers the agent treats as anomalies requiring explanation
    criticalSignals: ['churn_spike', 'revenue_drop', 'pipeline_stall'],

    // Domain-specific terminology mapping
    // The agent uses these words instead of generic equivalents
    terminology: {
      anomaly: 'signal',
      revenue: 'MRR',
      users: 'active accounts',
    } as Record<string, string>,

    // What each role cares about in THIS product specifically.
    // "Engineer" means something different in a K8s product vs a
    // fintech product. This context shapes every layout composition.
    roleContext: {
      admin: 'Platform health, user management, billing, and system configuration',
      ceo: 'Revenue growth, churn rate, investor-level KPIs, and board metrics',
      engineer:
        'API performance, error rates, deployment status, and infrastructure health',
      viewer: 'Read-only access to dashboards and summary reports',
    },
  },

  theme: {
    accentColor: '#4f8ef7', // primary brand colour
    accentColor2: '#a78bfa', // secondary
    accentColor3: '#34d399', // positive / success
    glassBlur: 'md' as const,
    borderRadius: 'lg' as const,
    darkMode: true,
  },

  agent: {
    // Display name of the AI copilot
    name: 'Nova',
    avatarEmoji: '◆',
    // Documented quality default — override with OLLAMA_MODEL env (see .env.example).
    ollamaModel: 'qwen2.5:0.5b',
    /** Used when `AI_LATENCY_PROFILE=responsive` (overridden by `OLLAMA_MODEL_FAST` env). */
    ollamaModelFast: 'qwen2.5:3b-instruct',
    /**
     * Show the AI adapter runtime badge (engine/status/model) in the UI.
     *
     * Toggle:
     * - `false` (default): hides `AdapterStatusBadge` everywhere (cleaner UI)
     * - `true`: shows the runtime badge in the Topbar, Agents page, and Copilot header
     */
    showAdapterStatus: false,
  },

  db: {
    // Set true for platforms that run migrations on deploy (e.g. Vercel)
    runMigrationsOnStartup: false,
  },

  features: {
    bentoReorder: true, // drag-to-reorder bento cards
    generativeLayout: true, // LLM composes layout from tool calls
    multiTenant: true, // tenant switching UI
    authEnabled: true, // auth UI and session management
  },
} as const

export type NovaConfig = typeof novaConfig
export type ProductConfig = typeof novaConfig.product
export type UserRole = keyof typeof novaConfig.product.roleContext
export type TenantPlan = 'free' | 'pro' | 'enterprise'
