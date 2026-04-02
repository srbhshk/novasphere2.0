'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import type { AuthAdapter } from '../auth.adapter.interface'
import type { AuthSession } from '../auth.types'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'
import { Input, Label, Button } from '../form-primitives'

export type LoginFormProps = {
  adapter: AuthAdapter
  loading?: boolean
  onSuccess?: (session: AuthSession) => void
  showOAuth?: boolean
  className?: string
  /** Merged into react-hook-form default values (e.g. demo password). */
  defaultValues?: Partial<LoginFormValues>
  /**
   * When set and the email field is empty and not focused, cycles a typewriter-style
   * placeholder through each string. Pauses while the user types or focuses the field.
   */
  rotatingEmailPlaceholders?: readonly string[]
}

const DEFAULT_EMAIL_PLACEHOLDER = 'you@example.com'

const TYPE_MS = 70
const HOLD_MS = 2100
const BETWEEN_MS = 480

function useRotatingEmailPlaceholder(
  candidates: readonly string[] | undefined,
  pauseAnimation: boolean,
): string {
  const [text, setText] = useState('')
  const emailIdxRef = useRef(0)
  const charIdxRef = useRef(0)
  const phaseRef = useRef<'typing' | 'hold'>('typing')

  useEffect(() => {
    if (candidates == null || candidates.length === 0 || pauseAnimation) {
      setText('')
      emailIdxRef.current = 0
      charIdxRef.current = 0
      phaseRef.current = 'typing'
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const run = (): void => {
      const list = candidates
      const idx = emailIdxRef.current % list.length
      const full = list[idx]
      if (full === undefined) return

      if (phaseRef.current === 'typing') {
        if (charIdxRef.current < full.length) {
          charIdxRef.current += 1
          setText(full.slice(0, charIdxRef.current))
          timeoutId = setTimeout(run, TYPE_MS)
        } else {
          phaseRef.current = 'hold'
          timeoutId = setTimeout(run, HOLD_MS)
        }
      } else {
        phaseRef.current = 'typing'
        charIdxRef.current = 0
        setText('')
        emailIdxRef.current += 1
        timeoutId = setTimeout(run, BETWEEN_MS)
      }
    }

    emailIdxRef.current = 0
    charIdxRef.current = 0
    phaseRef.current = 'typing'
    setText('')
    timeoutId = setTimeout(run, 0)

    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [candidates, pauseAnimation])

  return text
}

export function LoginForm({
  adapter,
  loading = false,
  onSuccess,
  showOAuth = true,
  className,
  defaultValues: defaultValuesProp,
  rotatingEmailPlaceholders,
}: LoginFormProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultValuesProp?.email ?? '',
      password: defaultValuesProp?.password ?? '',
    },
  })

  const emailValue = watch('email')
  const pausePlaceholder =
    emailValue.length > 0 ||
    emailFocused ||
    rotatingEmailPlaceholders == null ||
    rotatingEmailPlaceholders.length === 0
  const animatedEmailPlaceholder = useRotatingEmailPlaceholder(
    rotatingEmailPlaceholders,
    pausePlaceholder,
  )

  const emailRegister = register('email')

  const isBusy = loading || isSubmitting

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    const result = await adapter.signIn(values)
    if (result.success) {
      onSuccess?.(result.session)
    } else {
      setError('root', { type: 'manual', message: result.error })
    }
  }

  return (
    <GlassCard variant="medium" {...(className != null ? { className } : {})}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {errors.root?.message != null ? (
          <div
            role="alert"
            className="rounded-md bg-[color:var(--ns-color-danger-20)] px-3 py-2 text-sm text-[color:var(--ns-color-danger)]"
          >
            {errors.root.message}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-[color:var(--ns-color-text)]/90"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={
              rotatingEmailPlaceholders != null &&
              rotatingEmailPlaceholders.length > 0 &&
              !pausePlaceholder
                ? animatedEmailPlaceholder
                : DEFAULT_EMAIL_PLACEHOLDER
            }
            className="w-full rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 text-[color:var(--ns-color-text)] placeholder:text-[color:var(--ns-color-muted)] focus:border-[color:var(--ns-color-border-hi)] focus:ring-1 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
            name={emailRegister.name}
            ref={emailRegister.ref}
            onBlur={(e) => {
              setEmailFocused(false)
              void emailRegister.onBlur(e)
            }}
            onChange={emailRegister.onChange}
            onFocus={() => {
              setEmailFocused(true)
            }}
          />
          {errors.email?.message != null ? (
            <p className="text-sm text-[color:var(--ns-color-danger)]">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-[color:var(--ns-color-text)]/90"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 pr-10 text-[color:var(--ns-color-text)] placeholder:text-[color:var(--ns-color-muted)] focus:border-[color:var(--ns-color-border-hi)] focus:ring-1 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[color:var(--ns-color-muted)] hover:text-[color:var(--ns-color-text)]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password?.message != null ? (
            <p className="text-sm text-[color:var(--ns-color-danger)]">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isBusy}
          className="rounded-lg bg-[color:var(--ns-color-accent)] px-4 py-2 font-medium text-[color:var(--ns-color-bg)] hover:brightness-110 disabled:opacity-50"
        >
          {isBusy ? 'Signing in…' : 'Sign in'}
        </Button>
        {showOAuth && (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => adapter.signInWithOAuth('github')}
              className="flex-1 rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] py-2 text-sm text-[color:var(--ns-color-text)] hover:border-[color:var(--ns-color-border-hi)] hover:bg-[color:var(--ns-glass-bg-medium)]"
            >
              GitHub
            </Button>
            <Button
              type="button"
              onClick={() => adapter.signInWithOAuth('google')}
              className="flex-1 rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] py-2 text-sm text-[color:var(--ns-color-text)] hover:border-[color:var(--ns-color-border-hi)] hover:bg-[color:var(--ns-glass-bg-medium)]"
            >
              Google
            </Button>
          </div>
        )}
      </form>
    </GlassCard>
  )
}
