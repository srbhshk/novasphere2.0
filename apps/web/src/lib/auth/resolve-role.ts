import { createAuth } from '@/lib/auth/auth'

export type UserRole = 'admin' | 'ceo' | 'engineer' | 'viewer'

export function normalizeUserRole(role: unknown): UserRole {
  if (role === 'admin' || role === 'ceo' || role === 'engineer' || role === 'viewer') {
    return role
  }
  return 'viewer'
}

export async function resolveRoleFromSession(request: Request): Promise<UserRole> {
  try {
    const auth = await createAuth()
    const session = await auth.api.getSession({
      headers: new Headers(request.headers),
    })
    return normalizeUserRole(session?.user?.role)
  } catch {
    return 'viewer'
  }
}
