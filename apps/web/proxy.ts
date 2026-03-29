import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 proxy — the successor to the middleware.ts convention.
 * Runs in Node.js runtime — no edge runtime restrictions.
 *
 * Responsibilities:
 * - Redirect unauthenticated users to /sign-in for protected routes.
 * - Forward requests as-is for public routes and authenticated users.
 *
 * Role / user id for authorization on API routes come from the validated
 * Better Auth session in route handlers (e.g. POST /api/agent overwrites
 * client-supplied x-user-* headers). Client headers remain hints for
 * same-origin data hooks only.
 */

const PUBLIC_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function getSessionToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('better-auth.session_token')?.value
  if (cookieToken != null) {
    return cookieToken
  }
  return request.cookies.get('__Secure-better-auth.session_token')?.value ?? null
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const token = getSessionToken(request)
  const authenticated = Boolean(token)

  if (!authenticated && !isPublicPath(pathname)) {
    const destination = new URL('/sign-in', request.url)
    return NextResponse.redirect(destination)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
