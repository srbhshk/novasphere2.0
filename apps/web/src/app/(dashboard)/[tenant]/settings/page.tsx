'use client'

import { useState } from 'react'
import { Settings, Palette, FlaskConical, User } from 'lucide-react'
import { GlassCard, GlassPanel, Badge } from '@novasphere/ui-glass'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useCurrentRole } from '@/hooks/useCurrentRole'
import { useLayoutStore } from '@/store/layout.store'
import type { AgentRole } from '@/hooks/useCurrentRole'

type Tab = 'profile' | 'preferences' | 'demo'

const ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
  ceo: 'Executive view — revenue, growth, churn, and investor-level KPIs with board presentation layouts.',
  engineer:
    'Operations view — API latency, error rates, uptime, deployments, and system alerts.',
  admin:
    'Platform view — user management, plan distribution, feature adoption, and activity monitoring.',
  viewer: 'Read-only summary — top-line metrics and recent activity without edit access.',
}

const ROLE_LABELS: Record<AgentRole, string> = {
  ceo: 'CEO',
  engineer: 'Engineer',
  admin: 'Admin',
  viewer: 'Viewer',
}

export default function SettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('preferences')
  const { role } = useCurrentRole()
  const resetLayout = useLayoutStore((s) => s.resetLayout)
  const [demoRole, setDemoRole] = useState<AgentRole>(role)
  const [resetConfirmed, setResetConfirmed] = useState(false)

  function applyDemoRole(r: AgentRole): void {
    setDemoRole(r)
    // Inject the demo role into the x-user-role header by storing in sessionStorage.
    // The dashboard page reads from the auth session; for the demo we patch via
    // a reload with a custom search param that the DashboardShell can pick up.
    // Simplest demo approach: store in localStorage and reset layout so default
    // layout is re-seeded on next dashboard visit.
    try {
      window.localStorage.setItem('nova-demo-role', r)
    } catch {
      // ignore
    }
    resetLayout()
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette className="h-4 w-4" /> },
    { id: 'demo', label: 'Demo Controls', icon: <FlaskConical className="h-4 w-4" /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ns-color-accent)]/10">
          <Settings className="h-5 w-5 text-[var(--ns-color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--ns-color-text)]">Settings</h1>
          <p className="text-sm text-[var(--ns-color-muted)]">
            Preferences and demo controls
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-[var(--ns-glass-bg-subtle)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-[var(--ns-color-accent)]/10 text-[var(--ns-color-accent)] shadow-sm'
                : 'text-[var(--ns-color-muted)] hover:text-[var(--ns-color-text)]',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' ? (
        <GlassCard variant="medium" className="flex flex-col gap-4 p-6">
          <h2 className="text-base font-semibold text-[var(--ns-color-text)]">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ns-color-accent)]/20 text-2xl font-bold text-[var(--ns-color-accent)]">
              {ROLE_LABELS[role][0]}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--ns-color-text)]">
                Demo User
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--ns-color-muted)]">
                <span>Role:</span>
                <Badge variant="secondary" className="capitalize">
                  {ROLE_LABELS[role]}
                </Badge>
              </div>
            </div>
          </div>
          <GlassPanel variant="subtle" className="px-4 py-3">
            <p className="text-sm text-[var(--ns-color-muted)]">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </GlassPanel>
        </GlassCard>
      ) : null}

      {/* Preferences tab */}
      {activeTab === 'preferences' ? (
        <div className="flex flex-col gap-4">
          <GlassCard variant="medium" className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-base font-semibold text-[var(--ns-color-text)]">
                Dashboard Theme
              </h2>
              <p className="mt-1 text-xs text-[var(--ns-color-muted)]">
                Select a colour theme. Your preference is saved per session.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <span className="text-sm text-[var(--ns-color-muted)]">
                Click a swatch to apply
              </span>
            </div>
          </GlassCard>

          <GlassCard variant="medium" className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-base font-semibold text-[var(--ns-color-text)]">
                Layout
              </h2>
              <p className="mt-1 text-xs text-[var(--ns-color-muted)]">
                Reset the dashboard layout to the default for your role.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetLayout()
                setResetConfirmed(true)
                setTimeout(() => setResetConfirmed(false), 2000)
              }}
              className="w-fit rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-4 py-2 text-sm text-[var(--ns-color-text)] transition-colors hover:border-[var(--ns-color-accent)]/50 hover:text-[var(--ns-color-accent)]"
            >
              {resetConfirmed ? 'Layout reset!' : 'Reset to default layout'}
            </button>
          </GlassCard>
        </div>
      ) : null}

      {/* Demo controls tab */}
      {activeTab === 'demo' ? (
        <div className="flex flex-col gap-4">
          <GlassPanel variant="subtle" className="flex gap-3 px-5 py-4">
            <FlaskConical className="h-5 w-5 shrink-0 text-[var(--ns-color-accent)]" />
            <div>
              <div className="text-sm font-medium text-[var(--ns-color-text)]">
                Demo Role Switcher
              </div>
              <div className="text-xs text-[var(--ns-color-muted)]">
                Switch the active role to explore how the AI composes different layouts.
                The layout resets on role change. Requires revisiting the dashboard.
              </div>
            </div>
          </GlassPanel>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['ceo', 'engineer', 'admin', 'viewer'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => applyDemoRole(r)}
                className={[
                  'flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200',
                  demoRole === r
                    ? 'border-[var(--ns-color-accent)] bg-[var(--ns-color-accent)]/10'
                    : 'border-[var(--ns-color-border-subtle)] bg-[var(--ns-glass-bg-subtle)] hover:border-[var(--ns-color-accent)]/40',
                ].join(' ')}
              >
                <div className="text-sm font-semibold text-[var(--ns-color-text)]">
                  {ROLE_LABELS[r]}
                </div>
                <div className="text-xs leading-relaxed text-[var(--ns-color-muted)]">
                  {ROLE_DESCRIPTIONS[r].split('—')[1]?.trim() ?? ROLE_DESCRIPTIONS[r]}
                </div>
                {demoRole === r ? (
                  <Badge variant="default" className="w-fit text-[10px]">
                    Active
                  </Badge>
                ) : null}
              </button>
            ))}
          </div>

          <GlassCard variant="medium" className="flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold text-[var(--ns-color-text)]">
              Demo Prompts
            </h3>
            <p className="text-xs text-[var(--ns-color-muted)]">
              Try these exact phrases in the Nova copilot panel to trigger hardcoded demo
              scenarios:
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Show me what matters for the board meeting',
                'Make this better',
                'Board presentation',
                'Daily standup',
                'Investor review',
                'Show me customer health',
                'How are deployments going',
              ].map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-lg bg-[var(--ns-glass-bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--ns-color-text)]"
                >
                  &quot;{prompt}&quot;
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  )
}
