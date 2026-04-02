'use client'

import * as React from 'react'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/styles/driver-glass.css'

type DemoGuidedTourProps = {
  userId: string
  tenantId: string
}

const STORAGE_VERSION = 1
const COPILOT_COACHMARK_STORAGE_KEY = 'ns_copilot_coachmark_dismissed_v1'

function buildStorageKey(userId: string, tenantId: string): string {
  return `ns_demo_guided_nav_v${STORAGE_VERSION}:${userId}:${tenantId}`
}

function safeGetLocalStorageItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorageItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function resolveCopilotFabElement(): Element | null {
  // Copilot FAB lives inside @novasphere/ui-agent; we target via stable aria-label.
  const root = document.querySelector('[data-ns-tour="copilot-dock"]')
  if (!root) return null
  return root.querySelector('button[aria-label="Open copilot"]')
}

function resolveNotificationBellElement(): Element | null {
  return document.querySelector('[data-ns-tour="notifications-bell"]')
}

export default function DemoGuidedTour({
  userId,
  tenantId,
}: DemoGuidedTourProps): React.JSX.Element | null {
  const driverRef = React.useRef<Driver | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (userId === 'anonymous') return

    const key = buildStorageKey(userId, tenantId)
    const alreadyCompleted = safeGetLocalStorageItem(key) === '1'
    if (alreadyCompleted) return

    // Avoid double-overlays: the legacy Copilot coachmark is redundant when the guided tour runs.
    safeSetLocalStorageItem(COPILOT_COACHMARK_STORAGE_KEY, '1')

    const startIfReady = (): boolean => {
      const copilotFab = resolveCopilotFabElement()
      const bell = resolveNotificationBellElement()
      if (!copilotFab || !bell) return false

      const reachedSecondStepRef = { current: false }

      const d = driver({
        showProgress: true,
        allowClose: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 14,
        popoverClass: 'ns-demo-tour-popover',
        onDestroyed: () => {
          if (reachedSecondStepRef.current) {
            safeSetLocalStorageItem(key, '1')
          }
          driverRef.current = null
        },
      })

      driverRef.current = d

      d.setSteps([
        {
          element: copilotFab,
          popover: {
            title: 'Nova Copilot',
            description:
              'Start here. Ask for anomalies, explanations, and what to prioritize next.',
            side: 'left',
            align: 'start',
            showButtons: ['close', 'next'],
            nextBtnText: 'Next',
            onNextClick: () => {
              reachedSecondStepRef.current = true
              d.moveNext()
            },
            onCloseClick: () => {
              d.destroy()
            },
          },
        },
        {
          element: bell,
          popover: {
            title: 'Notifications',
            description:
              'Anomalies and system signals land here. Open this to investigate and send them to Copilot.',
            side: 'bottom',
            align: 'end',
            showButtons: ['close', 'next'],
            nextBtnText: 'Done',
            onNextClick: () => {
              safeSetLocalStorageItem(key, '1')
              d.destroy()
            },
            onCloseClick: () => {
              d.destroy()
            },
          },
        },
      ])

      d.drive()
      return true
    }

    // Wait briefly for the dock (dynamic import) to render.
    let attempts = 0
    const maxAttempts = 40
    const handle = window.setInterval(() => {
      attempts += 1
      const ok = startIfReady()
      if (ok || attempts >= maxAttempts) {
        window.clearInterval(handle)
      }
    }, 125)

    return () => {
      window.clearInterval(handle)
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [tenantId, userId])

  return null
}
