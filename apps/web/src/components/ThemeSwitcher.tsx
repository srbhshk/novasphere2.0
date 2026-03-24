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

  return (
    <div
      className="flex items-center gap-1.5"
      role="radiogroup"
      aria-label="Dashboard color theme"
    >
      {THEME_PRESET_ORDER.map((id) => {
        const meta = THEME_PRESETS[id]
        const selected = active === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={meta.name}
            onClick={() => {
              onSelect(id)
            }}
            className="relative size-7 shrink-0 rounded-full border border-[color:var(--ns-color-border)] shadow-sm transition-[transform,box-shadow] duration-[var(--ns-duration-base)] ease-[var(--ns-ease-smooth)] hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ns-color-accent)]"
            style={{
              background: `linear-gradient(135deg, ${meta.bgHex} 55%, ${meta.accentHex} 100%)`,
            }}
          >
            {selected ? (
              <span className="sr-only">{`${meta.name} (selected)`}</span>
            ) : (
              <span className="sr-only">{meta.name}</span>
            )}
            {selected ? (
              <span
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[color:var(--ns-color-accent)] ring-offset-2 ring-offset-[color:var(--ns-color-bg)]"
                aria-hidden
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
