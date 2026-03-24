'use client'

import type React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@novasphere/ui-glass'
import type { AuthAdapter } from '../auth.adapter.interface'
import { Input, Label, Button } from '../form-primitives'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export type ForgotPasswordFormProps = {
  adapter: AuthAdapter
  className?: string
}

export function ForgotPasswordForm({
  adapter,
  className,
}: ForgotPasswordFormProps): React.JSX.Element {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotFormValues): Promise<void> => {
    const result = await adapter.resetPassword(values.email)
    if (!result.success) {
      setError('root', {
        type: 'manual',
        message: result.error ?? 'Unable to send reset email. Please try again.',
      })
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <GlassCard variant="medium" {...(className != null ? { className } : {})}>
        <p className="text-sm text-[color:var(--ns-color-muted)]">
          If an account exists for that email, we&apos;ve sent reset instructions.
        </p>
      </GlassCard>
    )
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
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[color:var(--ns-color-accent)] px-4 py-2 font-medium text-[color:var(--ns-color-bg)] hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending…' : 'Reset password'}
        </Button>
      </form>
    </GlassCard>
  )
}
