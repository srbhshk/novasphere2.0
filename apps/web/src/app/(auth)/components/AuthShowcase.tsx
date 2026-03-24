'use client'

import type React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { novaConfig } from 'nova.config'

const NODE_POSITIONS = [
  { top: '16%', left: '50%' },
  { top: '34%', left: '74%' },
  { top: '56%', left: '66%' },
  { top: '72%', left: '36%' },
  { top: '44%', left: '22%' },
] as const

const CONNECTIONS = [
  { x1: 50, y1: 16, x2: 74, y2: 34 },
  { x1: 74, y1: 34, x2: 66, y2: 56 },
  { x1: 66, y1: 56, x2: 36, y2: 72 },
  { x1: 36, y1: 72, x2: 22, y2: 44 },
  { x1: 22, y1: 44, x2: 50, y2: 16 },
  { x1: 50, y1: 16, x2: 66, y2: 56 },
] as const

export default function AuthShowcase(): React.JSX.Element {
  const reduceMotion = useReducedMotion()
  const gradientMotionProps = reduceMotion
    ? {}
    : {
        animate: {
          opacity: [0.5, 0.85, 0.5],
          scale: [1, 1.04, 1],
        },
        transition: {
          duration: 7,
          ease: 'easeInOut',
          repeat: Number.POSITIVE_INFINITY,
        },
      }
  const outerRingMotionProps = reduceMotion
    ? {}
    : {
        animate: { rotateZ: [0, 360] },
        transition: { duration: 26, ease: 'linear', repeat: Number.POSITIVE_INFINITY },
      }
  const innerRingMotionProps = reduceMotion
    ? {}
    : {
        animate: { rotateZ: [360, 0] },
        transition: { duration: 18, ease: 'linear', repeat: Number.POSITIVE_INFINITY },
      }
  const tiltMotionProps = reduceMotion
    ? {}
    : {
        animate: { rotateY: [0, 6, 0], rotateX: [0, -6, 0] },
        transition: {
          duration: 8.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        },
      }

  return (
    <div className="relative flex h-full w-full items-center overflow-hidden border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-medium)] p-8 shadow-2xl backdrop-blur-xl">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.18),transparent_46%),radial-gradient(circle_at_54%_84%,rgba(167,139,250,0.2),transparent_52%)]"
        {...gradientMotionProps}
      />

      <div className="pointer-events-none absolute inset-0 opacity-45 [background:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_32%,transparent_55%,rgba(255,255,255,0.04)_100%)]" />

      <div className="relative z-10 grid w-full gap-7">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-1.5">
            <Image
              src="/branding/novasphere-mark.png"
              alt="Novasphere logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-sm object-cover"
              priority
            />
            <span className="text-xs font-medium tracking-[0.15em] text-[color:var(--ns-color-text)]/80 uppercase">
              Novasphere
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative h-[320px] rounded-2xl border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] p-5 [perspective:1300px]"
        >
          <motion.div
            aria-hidden
            className="absolute inset-6 rounded-full border border-[color:var(--ns-color-accent-2)]/35"
            {...outerRingMotionProps}
          />
          <motion.div
            aria-hidden
            className="absolute inset-11 rounded-full border border-[color:var(--ns-color-accent-3)]/25"
            {...innerRingMotionProps}
          />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            aria-hidden
          >
            {CONNECTIONS.map((line, index) => (
              <motion.line
                key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="rgba(120, 140, 170, 0.45)"
                strokeWidth="0.45"
                strokeLinecap="round"
                initial={{ pathLength: 0.4, opacity: 0.2 }}
                {...(reduceMotion
                  ? {}
                  : {
                      animate: { pathLength: [0.4, 1, 0.4], opacity: [0.2, 0.7, 0.2] },
                      transition: {
                        duration: 4.6,
                        delay: index * 0.18,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      },
                    })}
              />
            ))}
          </svg>

          {NODE_POSITIONS.map((position, index) => (
            <motion.span
              key={`${position.top}-${position.left}`}
              className="absolute h-3.5 w-3.5 rounded-full border border-[color:var(--ns-color-text)]/60 bg-[color:var(--ns-color-accent)]/85 shadow-[0_0_24px_var(--ns-glow-accent)]"
              style={position}
              {...(reduceMotion
                ? {}
                : {
                    animate: {
                      scale: [1, 1.45, 1],
                      opacity: [0.55, 1, 0.55],
                      y: [0, -4, 0],
                    },
                    transition: {
                      duration: 3.3,
                      delay: index * 0.26,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    },
                  })}
            />
          ))}

          {[0, 1, 2].map((index) => (
            <motion.div
              key={`pulse-${index}`}
              className="absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--ns-color-accent)]/25"
              initial={{ scale: 0.8, opacity: 0.4 }}
              {...(reduceMotion
                ? {}
                : {
                    animate: { scale: [0.82, 1.55], opacity: [0.36, 0] },
                    transition: {
                      duration: 3.8,
                      delay: index * 1.1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeOut',
                    },
                  })}
            />
          ))}

          <motion.div
            className="absolute inset-0 rounded-2xl border border-[color:var(--ns-color-border)]/80"
            {...tiltMotionProps}
          />

          <div className="absolute bottom-5 left-5 rounded-full border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-1 text-[11px] tracking-[0.2em] text-[color:var(--ns-color-muted)] uppercase">
            {novaConfig.product.domain}
          </div>
          <div className="absolute right-5 bottom-5 rounded-full border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-1 text-[11px] tracking-[0.16em] text-[color:var(--ns-color-muted)] uppercase">
            Neural Loop Active
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 text-xs text-[color:var(--ns-color-muted)]">
          {novaConfig.product.criticalSignals.slice(0, 3).map((signal) => (
            <span
              key={signal}
              className="rounded-full border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-1.5 text-center tracking-[0.12em] uppercase"
            >
              {signal.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
