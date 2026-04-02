'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { GlassCard, Badge } from '@novasphere/ui-glass'
import { DEMO_SEED_EMAILS } from '@/lib/demo-seed-credentials'

const STORAGE_KEY = 'ns_signin_demo_tip_dismissed_v1'

/** Estimated tooltip width (px) before the tooltip node has measurable layout. */
const ESTIMATED_TIP_WIDTH = 320

type TooltipPosition = {
  top: number
  left: number
  transform: string
}

function getEmailInput(): HTMLElement | null {
  const el = document.getElementById('email')
  return el instanceof HTMLElement ? el : null
}

/**
 * Coachmark must be portaled to `document.body`.
 *
 * The sign-in shell uses `backdrop-blur-xl` (`backdrop-filter`). Any ancestor with
 * `backdrop-filter`, `transform`, or `filter` establishes a containing block for
 * `position: fixed` descendants. Coordinates from `getBoundingClientRect()` are
 * viewport-based; mixing them with `fixed` inside that subtree places the tooltip
 * outside the visible region (or clips it). Porting to the document body restores
 * the normal fixed/viewport coordinate model.
 */
export default function SignInCoachmark(): React.JSX.Element | null {
  const [dismissed, setDismissed] = React.useState(true)
  const [documentReady, setDocumentReady] = React.useState(false)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<TooltipPosition | null>(null)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      setDismissed(stored === '1')
    } catch {
      setDismissed(true)
    }
    setDocumentReady(true)
  }, [])

  const dismiss = React.useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Ignore
    }
  }, [])

  const updatePosition = React.useCallback((): void => {
    if (dismissed) return
    const input = getEmailInput()
    if (!input) return

    const rect = input.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    const tip = tooltipRef.current
    const tipRect = tip?.getBoundingClientRect()
    const tipW =
      tipRect != null && tipRect.width > 0 ? tipRect.width : ESTIMATED_TIP_WIDTH

    const gap = 12
    const pad = 16
    const isLg = window.matchMedia('(min-width: 1024px)').matches

    const placeBelow = (): void => {
      let left = rect.left
      const maxLeft = window.innerWidth - tipW - pad
      if (left > maxLeft) left = Math.max(pad, maxLeft)
      if (left < pad) left = pad
      setPosition({
        top: rect.bottom + gap,
        left,
        transform: 'none',
      })
    }

    if (isLg) {
      const proposedLeft = rect.right + gap
      const fitsRight = proposedLeft + tipW <= window.innerWidth - pad
      if (fitsRight) {
        setPosition({
          top: rect.top + rect.height / 2,
          left: proposedLeft,
          transform: 'translateY(-50%)',
        })
        return
      }
    }

    placeBelow()
  }, [dismissed])

  React.useLayoutEffect(() => {
    if (dismissed || !documentReady) return

    let cancelled = false

    const tick = (): void => {
      if (cancelled) return
      updatePosition()
    }

    tick()
    requestAnimationFrame(() => {
      tick()
      requestAnimationFrame(tick)
    })

    const onResizeOrScroll = (): void => {
      tick()
    }

    window.addEventListener('resize', onResizeOrScroll)
    window.addEventListener('scroll', onResizeOrScroll, true)

    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = (): void => {
      tick()
    }
    mq.addEventListener('change', onMq)

    const mo = new MutationObserver(() => {
      if (getEmailInput() != null) tick()
    })
    mo.observe(document.body, { childList: true, subtree: true })

    let pollId: number | null = null
    const startPoll = (): void => {
      if (getEmailInput() != null) {
        tick()
        return
      }
      let n = 0
      pollId = window.setInterval(() => {
        n += 1
        tick()
        if (getEmailInput() != null || n > 200) {
          if (pollId != null) window.clearInterval(pollId)
          pollId = null
        }
      }, 50)
    }
    startPoll()

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResizeOrScroll)
      window.removeEventListener('scroll', onResizeOrScroll, true)
      mq.removeEventListener('change', onMq)
      mo.disconnect()
      if (pollId != null) window.clearInterval(pollId)
    }
  }, [dismissed, documentReady, updatePosition])

  if (dismissed || !documentReady) return null

  const layer = (
    <div
      className="pointer-events-none fixed inset-0 z-[10000]"
      data-ns-signin-demo-tip-root
    >
      <div
        ref={tooltipRef}
        className={
          position != null
            ? 'pointer-events-none fixed w-[min(22rem,calc(100vw-2rem))] opacity-100 transition-opacity duration-150 max-sm:w-[min(20rem,calc(100vw-2rem))]'
            : 'pointer-events-none fixed w-[min(22rem,calc(100vw-2rem))] opacity-0 transition-opacity duration-150 max-sm:w-[min(20rem,calc(100vw-2rem))]'
        }
        style={
          position != null
            ? {
                top: position.top,
                left: position.left,
                transform: position.transform,
              }
            : undefined
        }
        data-ns-signin-demo-tip-panel
      >
        <GlassCard
          variant="strong"
          className="pointer-events-auto p-4 shadow-[0_22px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="outline">Demo sign-in</Badge>
              <div className="mt-2 text-sm text-[var(--ns-color-muted)]">
                Use one of these emails with password{' '}
                <span className="rounded-md border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-1.5 py-0.5 font-mono text-xs text-[var(--ns-color-text)]">
                  password
                </span>
                .
              </div>

              <div className="mt-3 grid gap-1">
                {DEMO_SEED_EMAILS.map((email) => (
                  <div
                    key={email}
                    className="truncate rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-glass-bg-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--ns-color-text)]"
                  >
                    {email}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="rounded p-1 text-[var(--ns-color-muted)] hover:bg-[var(--ns-glass-bg-subtle)] hover:text-[var(--ns-color-text)]"
              aria-label="Dismiss demo sign-in tip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )

  return createPortal(layer, document.body)
}
