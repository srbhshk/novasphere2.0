import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PREFIXES = ['/sign-in', '/sign-up', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function getSessionToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('better-auth.session_token')?.value
  if (cookieToken) {
    return cookieToken
  }
  return request.cookies.get('__Secure-better-auth.session_token')?.value ?? null
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const token = getSessionToken(request)
  const authenticated = Boolean(token)

  if (!authenticated && !isPublicPath(pathname)) {
    const destination = new URL('/sign-in', request.url)
    return NextResponse.redirect(destination)
  }

  const response = NextResponse.next()
  if (authenticated) {
    response.headers.set('x-user-id', 'session-user')
    response.headers.set('x-user-role', 'viewer')
    response.headers.set('x-tenant-id', 'demo')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
