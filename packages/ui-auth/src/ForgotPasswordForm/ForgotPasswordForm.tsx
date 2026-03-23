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
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotFormValues): Promise<void> => {
    await adapter.resetPassword(values.email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <GlassCard variant="medium" {...(className != null ? { className } : {})}>
        <p className="text-sm text-white/80">
          If an account exists for that email, we&apos;ve sent reset instructions.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="medium" {...(className != null ? { className } : {})}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-white/15 px-4 py-2 font-medium text-white hover:bg-white/25 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending…' : 'Reset password'}
        </Button>
      </form>
    </GlassCard>
  )
}
