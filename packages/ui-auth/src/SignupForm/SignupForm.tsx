'use client'

import type React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { GlassCard } from '@novasphere/ui-glass'
import type { AuthAdapter } from '../auth.adapter.interface'
import type { AuthSession } from '../auth.types'
import { signupSchema, type SignupFormValues } from '../schemas/signup.schema'
import { Input, Label, Button } from '../form-primitives'

export type SignupFormProps = {
  adapter: AuthAdapter
  loading?: boolean
  onSuccess?: (session: AuthSession) => void
  className?: string
}

export function SignupForm({
  adapter,
  loading = false,
  onSuccess,
  className,
}: SignupFormProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const isBusy = loading || isSubmitting

  const onSubmit = async (values: SignupFormValues): Promise<void> => {
    const result = await adapter.signUp({
      name: values.name,
      email: values.email,
      password: values.password,
    })
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
            htmlFor="name"
            className="text-sm font-medium text-[color:var(--ns-color-text)]/90"
          >
            Name
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 text-[color:var(--ns-color-text)] placeholder:text-[color:var(--ns-color-muted)] focus:border-[color:var(--ns-color-border-hi)] focus:ring-1 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
            {...register('name')}
          />
          {errors.name?.message != null ? (
            <p className="text-sm text-[color:var(--ns-color-danger)]">
              {errors.name.message}
            </p>
          ) : null}
        </div>
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
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 text-[color:var(--ns-color-text)] placeholder:text-[color:var(--ns-color-muted)] focus:border-[color:var(--ns-color-border-hi)] focus:ring-1 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
            {...register('email')}
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
              autoComplete="new-password"
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
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="confirm-password"
            className="text-sm font-medium text-[color:var(--ns-color-text)]/90"
          >
            Confirm password
          </Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-[color:var(--ns-color-border)] bg-[color:var(--ns-glass-bg-subtle)] px-3 py-2 text-[color:var(--ns-color-text)] placeholder:text-[color:var(--ns-color-muted)] focus:border-[color:var(--ns-color-border-hi)] focus:ring-1 focus:ring-[color:var(--ns-color-accent-20)] focus:outline-none"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword?.message != null ? (
            <p className="text-sm text-[color:var(--ns-color-danger)]">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isBusy}
          className="rounded-lg bg-[color:var(--ns-color-accent)] px-4 py-2 font-medium text-[color:var(--ns-color-bg)] hover:brightness-110 disabled:opacity-50"
        >
          {isBusy ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </GlassCard>
  )
}
