'use client'

import * as React from 'react'
import { THEME_PRESETS, type ThemePreset } from '@novasphere/tokens'
import { useSession } from '@/lib/auth/auth-client'
import {
  THEME_COOKIE_NAME,
  normalizeThemePreset,
  THEME_PRESET_ORDER,
  THEME_STORAGE_KEY,
  isValidThemePreset,
} from '@/lib/theme-presets'

function applyThemeToDocument(preset: ThemePreset): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.setAttribute('data-theme', preset)
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(preset)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export default function ThemeSwitcher(): React.JSX.Element {
  const { data: sessionData, isPending } = useSession()
  const [active, setActive] = React.useState<ThemePreset>('nova-dark')

  React.useLayoutEffect(() => {
    const fromStorage = (() => {
      try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
        return isValidThemePreset(raw) ? raw : null
      } catch {
        return null
      }
    })()

    const initial = normalizeThemePreset(fromStorage ?? 'nova-dark')
    applyThemeToDocument(initial)
    setActive(initial)

    if (isPending) {
      return
    }

    if (sessionData == null) {
      return
    }

    void (async () => {
      try {
        const res = await fetch('/api/user/preferences', {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) {
          return
        }
        const data: unknown = await res.json()
        if (!data || typeof data !== 'object') {
          return
        }
        const raw = (data as Record<string, unknown>)['themePreset']
        if (isValidThemePreset(raw)) {
          const normalized = normalizeThemePreset(raw)
          applyThemeToDocument(normalized)
          setActive(normalized)
          try {
            window.localStorage.setItem(THEME_STORAGE_KEY, normalized)
          } catch {
            /* ignore quota */
          }
        }
      } catch {
        /* offline — keep local */
      }
    })()
  }, [isPending, sessionData])

  const onSelect = React.useCallback(
    (preset: ThemePreset) => {
      const normalized = normalizeThemePreset(preset)
      applyThemeToDocument(normalized)
      setActive(normalized)
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, normalized)
      } catch {
        /* ignore */
      }

      if (sessionData != null) {
        void fetch('/api/user/preferences', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themePreset: normalized }),
        }).catch(() => {
          /* offline — localStorage + cookie still apply */
        })
      }
    },
    [sessionData],
  )

  const { currentIndex, currentMeta, nextPreset, nextMeta } = React.useMemo(() => {
    const order: readonly ThemePreset[] =
      THEME_PRESET_ORDER.length > 0 ? THEME_PRESET_ORDER : (['nova-dark'] as const)
    const idx = Math.max(0, order.indexOf(active))
    const currentId = order[idx] ?? 'nova-dark'
    const nextId = order[(idx + 1) % order.length] ?? 'nova-dark'
    const current = THEME_PRESETS[currentId]
    const next = THEME_PRESETS[nextId]
    return {
      currentIndex: idx,
      currentMeta: current,
      nextPreset: nextId,
      nextMeta: next,
    }
  }, [active])

  return (
    <button
      type="button"
      onClick={() => onSelect(nextPreset)}
      className={[
        'group relative inline-flex h-9 items-center gap-2 rounded-full border border-[var(--ns-color-border)] px-3',
        'bg-[linear-gradient(180deg,var(--ns-glass-bg-strong),var(--ns-glass-bg-subtle))]',
        'shadow-[0_10px_35px_rgba(0,0,0,0.35)]',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_16px_55px_rgba(0,0,0,0.45)]',
        'focus-visible:ring-2 focus-visible:ring-[color:var(--ns-color-accent)]/60 focus-visible:outline-none',
      ].join(' ')}
      aria-label={`Theme: ${currentMeta.name}. Activate to switch to ${nextMeta.name}.`}
      title={`Theme: ${currentMeta.name} → ${nextMeta.name}`}
    >
      {/* Glow plate */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(60%_60%_at_30%_30%,var(--ns-color-accent-20),transparent_70%)] opacity-70 blur-md transition-opacity duration-200 group-hover:opacity-95"
      />

      {/* Current theme chip */}
      <span
        className="relative h-5 w-5 rounded-full border border-[color:var(--ns-color-border)] shadow-sm"
        aria-hidden="true"
        style={{
          background: `linear-gradient(135deg, ${currentMeta.bgHex} 55%, ${currentMeta.accentHex} 100%)`,
        }}
      />

      <span className="relative flex min-w-0 items-baseline gap-2">
        <span className="truncate text-xs font-semibold tracking-wide text-[var(--ns-color-text)]">
          {currentMeta.name}
        </span>
        <span className="hidden text-[11px] tracking-wide text-[var(--ns-color-muted)] sm:inline">
          Theme
        </span>
      </span>

      {/* Next preview dot + step indicator */}
      <span className="relative ml-1 flex items-center gap-2" aria-hidden="true">
        <span
          className="h-3 w-3 rounded-full border border-[color:var(--ns-color-border-subtle)] opacity-80"
          style={{
            background: `linear-gradient(135deg, ${nextMeta.bgHex} 55%, ${nextMeta.accentHex} 100%)`,
          }}
        />
        <span className="text-[10px] text-[var(--ns-color-muted)] tabular-nums">
          {currentIndex + 1}/{THEME_PRESET_ORDER.length}
        </span>
      </span>
    </button>
  )
}
