export type AuthPlan = 'free' | 'pro' | 'enterprise'

export type AuthSession = {
  userId: string
  email: string
  name: string
  image?: string
  tenantId: string
  role: string
  plan: AuthPlan
}

export type AuthResultSuccess = {
  success: true
  session: AuthSession
  error?: never
}

export type AuthResultFailure = {
  success: false
  error: string
  session?: never
}

export type AuthResult = AuthResultSuccess | AuthResultFailure

export type SignInCredentials = {
  email: string
  password: string
}

export type SignUpCredentials = {
  name: string
  email: string
  password: string
}
