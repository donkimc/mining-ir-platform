import { PLATFORM_ROOT_DOMAIN } from '@/lib/host'

function firstHeader(request: Request, name: string): string | null {
  const raw = request.headers.get(name)
  if (!raw) return null
  return raw.split(',')[0]?.trim() || null
}

function hostnameOf(hostHeader: string): string {
  return hostHeader.split(':')[0]?.toLowerCase() || ''
}

/** Container / loopback hosts that must not appear in public redirects. */
export function isInternalRequestHost(hostHeader: string): boolean {
  const hostname = hostnameOf(hostHeader)
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.railway.internal') ||
    hostname.endsWith('.local')
  )
}

/**
 * Public origin for redirects behind Railway/Cloudflare.
 * Prefer forwarded headers; never emit localhost:8080 in production.
 */
export function getPublicRequestOrigin(request: Request): string {
  const forwardedHost = firstHeader(request, 'x-forwarded-host')
  const host = forwardedHost || firstHeader(request, 'host')
  const forwardedProto = firstHeader(request, 'x-forwarded-proto')

  if (host && !isInternalRequestHost(host)) {
    const proto =
      forwardedProto === 'http' || forwardedProto === 'https'
        ? forwardedProto
        : 'https'
    return `${proto}://${host}`
  }

  if (process.env.NODE_ENV === 'production') {
    return `https://admin.${PLATFORM_ROOT_DOMAIN}`
  }

  try {
    return new URL(request.url).origin
  } catch {
    return 'http://localhost:3000'
  }
}

export function absoluteAppUrl(request: Request, pathname: string): URL {
  return new URL(pathname, `${getPublicRequestOrigin(request)}/`)
}
