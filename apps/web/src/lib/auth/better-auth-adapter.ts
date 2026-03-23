import type { AuthAdapter } from '@novasphere/ui-auth'
import type {
  AuthResult,
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
} from '@novasphere/ui-auth'
import { authClient } from '@/lib/auth/auth-client'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function readString(input: UnknownRecord, key: string, fallback = ''): string {
  const value = input[key]
  return typeof value === 'string' ? value : fallback
}

export function toAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) {
    return null
  }

  const userValue = value.user
  if (!isRecord(userValue)) {
    return null
  }

  // getSession() returns { user, session }. Email sign-in/up return { user, token, redirect? } with no nested session.
  const sessionValue = value.session
  const sessionRecord = isRecord(sessionValue) ? sessionValue : null

  const userId = readString(userValue, 'id')
  const email = readString(userValue, 'email')
  const name = readString(userValue, 'name', 'User')
  const image = readString(userValue, 'image')
  const role = readString(userValue, 'role', 'viewer')
  const tenantId =
    sessionRecord != null
      ? readString(sessionRecord, 'activeOrganizationId', 'demo')
      : 'demo'

  if (userId.length === 0 || email.length === 0) {
    return null
  }

  return {
    userId,
    email,
    name,
    ...(image.length > 0 ? { image } : {}),
    role,
    tenantId,
    plan: 'pro',
  }
}

function authErrorMessage(result: unknown, fallback: string): string {
  if (!isRecord(result)) {
    return fallback
  }

  const errorValue = result.error
  if (!isRecord(errorValue)) {
    return fallback
  }

  const message = readString(errorValue, 'message')
  return message.length > 0 ? message : fallback
}

export class BetterAuthAdapter implements AuthAdapter {
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const result = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    })

    const session = toAuthSession(result.data)
    if (session == null) {
      return {
        success: false,
        error: authErrorMessage(result, 'Unable to sign in. Please try again.'),
      }
    }

    return {
      success: true,
      session,
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    const result = await authClient.signUp.email({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    })

    const session = toAuthSession(result.data)
    if (session == null) {
      return {
        success: false,
        error: authErrorMessage(result, 'Unable to create account. Please try again.'),
      }
    }

    return {
      success: true,
      session,
    }
  }

  async signInWithOAuth(provider: 'github' | 'google'): Promise<void> {
    await authClient.signIn.social({
      provider,
      callbackURL: '/demo/dashboard',
    })
  }

  async signOut(): Promise<void> {
    await authClient.signOut()
  }

  async getSession(): Promise<AuthSession | null> {
    const result = await authClient.getSession()
    return toAuthSession(result.data)
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/sign-in`,
    })

    if (result.error != null) {
      return {
        success: false,
        error: authErrorMessage(result, 'Unable to send reset email.'),
      }
    }

    return { success: true }
  }
}

export const betterAuthAdapter: AuthAdapter = new BetterAuthAdapter()
