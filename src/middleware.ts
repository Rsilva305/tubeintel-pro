import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require a logged-in user
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (!needsAuth) {
    return NextResponse.next()
  }

  // Presence check only: httpOnly cookies set by /api/auth/set-secure-session.
  // Actual token validation happens in API routes against Supabase; this gate
  // stays lenient so a cookie edge case degrades to a login redirect, never a lockout.
  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-auth-token')

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
