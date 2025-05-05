import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporarily disabled middleware to resolve loading issues
export function middleware(request: NextRequest) {
  // Just pass through all requests
  return NextResponse.next()
}

// Empty matcher to essentially disable middleware
export const config = {
  matcher: [],
} 