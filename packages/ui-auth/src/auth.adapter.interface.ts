import type {
  AuthResult,
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
} from './auth.types'

export type OAuthProvider = 'github' | 'google'

export type AuthAdapter = {
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  signOut: () => Promise<void>
  getSession: () => Promise<AuthSession | null>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}
