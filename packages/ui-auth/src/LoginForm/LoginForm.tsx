'use client'

import type React from 'react'
import { useState } from 'react'
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
}

export function LoginForm({
  adapter,
  loading = false,
  onSuccess,
  showOAuth = true,
  className,
}: LoginFormProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {errors.root?.message != null ? (
          <div
            role="alert"
            className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {errors.root.message}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-white/90">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
            {...register('email')}
          />
          {errors.email?.message != null ? (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-white/90">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-white/60 hover:text-white/90"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password?.message != null ? (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isBusy}
          className="rounded-lg bg-white/15 px-4 py-2 font-medium text-white hover:bg-white/25 disabled:opacity-50"
        >
          {isBusy ? 'Signing in…' : 'Sign in'}
        </Button>
        {showOAuth && (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => adapter.signInWithOAuth('github')}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              GitHub
            </Button>
            <Button
              type="button"
              onClick={() => adapter.signInWithOAuth('google')}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              Google
            </Button>
          </div>
        )}
      </form>
    </GlassCard>
  )
}
