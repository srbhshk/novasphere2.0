import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { env } from '@/lib/env'

export const authClient = createAuthClient({
  baseURL:
    typeof window === 'undefined' ? env.NEXT_PUBLIC_APP_URL : window.location.origin,
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          required: false,
        },
        tenantId: {
          type: 'string',
          required: false,
        },
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
