/**
 * Hostname classification and tenant subdomain extraction (ADR-0016).
 * Pure helpers — no Payload I/O — so unit tests can cover the matrix without a request.
 */

export const PLATFORM_ROOT_DOMAIN = 'nrlaunch.com'

export const RESERVED_TENANT_LABELS = [
  'www',
  'admin',
  'app',
  'api',
  'cms',
  'demo',
  'staging',
  'preview',
  'mail',
] as const

export type HostKind =
  | 'apex'
  | 'www'
  | 'admin'
  | 'tenant'
  | 'reserved'
  | 'unknown_platform'
  | 'local'
  | 'preview'
  | 'other'

export type ClassifiedHost = {
  rawHost: string
  hostname: string
  kind: HostKind
  /** Normalized tenant subdomain when kind === 'tenant'. */
  tenantSubdomain: string | null
}

/** Lowercase hostname without port or trailing dot. */
export function normalizeHostname(hostHeader: string): string {
  const withoutPort = hostHeader.split(':')[0] || ''
  return withoutPort.replace(/\.$/, '').toLowerCase().trim()
}

export function isLocalDevHost(hostname: string): boolean {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  )
}

export function isVercelPreviewHost(hostname: string): boolean {
  return hostname.endsWith('.vercel.app')
}

export function isReservedTenantLabel(label: string): boolean {
  return (RESERVED_TENANT_LABELS as readonly string[]).includes(label)
}

/**
 * Classify a Host header for routing.
 * Exact tenant form: `<subdomain>.nrlaunch.com` with a non-reserved label.
 */
export function classifyHost(hostHeader: string): ClassifiedHost {
  const hostname = normalizeHostname(hostHeader)
  const base: Omit<ClassifiedHost, 'kind' | 'tenantSubdomain'> = {
    rawHost: hostHeader,
    hostname,
  }

  if (isLocalDevHost(hostname)) {
    return { ...base, kind: 'local', tenantSubdomain: null }
  }

  if (isVercelPreviewHost(hostname)) {
    return { ...base, kind: 'preview', tenantSubdomain: null }
  }

  if (hostname === PLATFORM_ROOT_DOMAIN) {
    return { ...base, kind: 'apex', tenantSubdomain: null }
  }

  if (hostname === `www.${PLATFORM_ROOT_DOMAIN}`) {
    return { ...base, kind: 'www', tenantSubdomain: null }
  }

  if (hostname === `admin.${PLATFORM_ROOT_DOMAIN}`) {
    return { ...base, kind: 'admin', tenantSubdomain: null }
  }

  if (hostname.endsWith(`.${PLATFORM_ROOT_DOMAIN}`)) {
    const label = hostname.slice(0, -(PLATFORM_ROOT_DOMAIN.length + 1))
    if (!label || label.includes('.')) {
      return { ...base, kind: 'unknown_platform', tenantSubdomain: null }
    }
    if (isReservedTenantLabel(label)) {
      return { ...base, kind: 'reserved', tenantSubdomain: null }
    }
    return { ...base, kind: 'tenant', tenantSubdomain: label }
  }

  return { ...base, kind: 'other', tenantSubdomain: null }
}

export function isAdminHost(hostname: string): boolean {
  const kind = classifyHost(hostname).kind
  // Local/preview may host admin routes for development.
  return kind === 'admin' || kind === 'local' || kind === 'preview'
}

export function isMarketingHost(hostname: string): boolean {
  const kind = classifyHost(hostname).kind
  return kind === 'apex' || kind === 'www'
}

/**
 * Whether DEFAULT_TENANT_SLUG may be used as a fallback for this host.
 * Never on Production-like nrlaunch hosts or when NODE_ENV is production.
 */
export function mayUseDefaultTenantSlug(args: {
  hostname: string
  nodeEnv: string | undefined
}): boolean {
  if (args.nodeEnv === 'production') return false
  const kind = classifyHost(args.hostname).kind
  if (kind === 'apex' || kind === 'www' || kind === 'admin') return false
  if (kind === 'tenant' || kind === 'reserved' || kind === 'unknown_platform') return false
  return kind === 'local' || kind === 'preview' || kind === 'other'
}
