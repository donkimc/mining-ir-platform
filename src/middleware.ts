import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { classifyHost, PLATFORM_ROOT_DOMAIN } from '@/lib/host'

/**
 * Edge routing for nrlaunch.com hosts (ADR-0016 / ADR-0018).
 * - www → apex redirect
 * - Authenticated surfaces only on admin / local / preview hosts
 * - Public tenant/marketing hosts reject /dashboard, /admin, /cms
 */
export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('host') || ''
  const host = classifyHost(hostHeader)
  const { pathname } = request.nextUrl

  if (host.kind === 'www') {
    const url = request.nextUrl.clone()
    url.hostname = PLATFORM_ROOT_DOMAIN
    url.protocol = 'https:'
    return NextResponse.redirect(url, 308)
  }

  const isAuthSurface =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cms') ||
    pathname === '/login' ||
    pathname === '/logout'

  if (isAuthSurface) {
    const allowed =
      host.kind === 'admin' || host.kind === 'local' || host.kind === 'preview'
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.hostname = `admin.${PLATFORM_ROOT_DOMAIN}`
      url.protocol = 'https:'
      url.pathname = pathname.startsWith('/login') ? '/login' : pathname
      return NextResponse.redirect(url, 307)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
