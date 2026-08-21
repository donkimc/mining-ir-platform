import { notFound } from 'next/navigation'

import { getPayloadClient } from '@/lib/auth'
import {
  classifyHost,
  mayUseDefaultTenantSlug,
  normalizeHostname,
  type ClassifiedHost,
} from '@/lib/host'
import type { Company } from '@/payload-types'

export function shouldAcceptTenantSlugHeader(args: {
  nodeEnv: string | undefined
  hasHeader: boolean
  trustedProxy: boolean
}): boolean {
  return args.hasHeader && (args.nodeEnv !== 'production' || args.trustedProxy)
}

/** @deprecated Use classifyHost / isLocalDevHost from `@/lib/host`. Kept for older tests. */
export function isPlatformDeploymentHost(hostname: string): boolean {
  const kind = classifyHost(hostname).kind
  return kind === 'local' || kind === 'preview'
}

export type TenantResolution =
  | { kind: 'tenant'; slug: string; host: ClassifiedHost }
  | { kind: 'marketing'; host: ClassifiedHost }
  | { kind: 'admin'; host: ClassifiedHost }
  | { kind: 'not_found'; host: ClassifiedHost; reason: string }

/**
 * Resolve how this request should be treated (ADR-0016).
 * Does not load a Company — callers fetch after receiving kind === 'tenant'.
 */
export async function resolveRequestTenant(): Promise<TenantResolution> {
  try {
    const { headers } = await import('next/headers')
    const headerStore = await headers()
    const hostHeader = headerStore.get('host') || ''
    const host = classifyHost(hostHeader)

    const fromHeader = headerStore.get('x-tenant-slug')
    const proxySecret = process.env.TENANT_PROXY_SECRET
    const providedProxySecret = headerStore.get('x-tenant-proxy-secret')
    const trustedProxy =
      Boolean(proxySecret) && Boolean(providedProxySecret) && providedProxySecret === proxySecret

    if (
      shouldAcceptTenantSlugHeader({
        nodeEnv: process.env.NODE_ENV,
        hasHeader: Boolean(fromHeader),
        trustedProxy,
      }) &&
      fromHeader
    ) {
      return {
        kind: 'tenant',
        slug: fromHeader.trim().toLowerCase(),
        host,
      }
    }

    if (host.kind === 'apex' || host.kind === 'www') {
      return { kind: 'marketing', host }
    }

    if (host.kind === 'admin') {
      return { kind: 'admin', host }
    }

    if (host.kind === 'tenant' && host.tenantSubdomain) {
      return { kind: 'tenant', slug: host.tenantSubdomain, host }
    }

    if (host.kind === 'reserved' || host.kind === 'unknown_platform') {
      return {
        kind: 'not_found',
        host,
        reason: 'Unknown or reserved platform host',
      }
    }

    // Local / Preview / other: optional DEFAULT_TENANT_SLUG only when allowed.
    if (
      mayUseDefaultTenantSlug({
        hostname: host.hostname,
        nodeEnv: process.env.NODE_ENV,
      })
    ) {
      const fallback = process.env.DEFAULT_TENANT_SLUG
      if (fallback) {
        return { kind: 'tenant', slug: fallback.toLowerCase(), host }
      }
    }

    return {
      kind: 'not_found',
      host,
      reason: 'No tenant for host and DEFAULT_TENANT_SLUG unavailable',
    }
  } catch {
    // Outside a Next.js request (scripts / some tests).
    const fallback = process.env.DEFAULT_TENANT_SLUG
    if (fallback && process.env.NODE_ENV !== 'production') {
      return {
        kind: 'tenant',
        slug: fallback.toLowerCase(),
        host: classifyHost('localhost'),
      }
    }
    return {
      kind: 'not_found',
      host: classifyHost('localhost'),
      reason: 'No request context and no local DEFAULT_TENANT_SLUG',
    }
  }
}

/** Sprint 1-compatible slug helper used by public pages that expect a tenant. */
export async function resolveTenantSlug(): Promise<string> {
  const resolution = await resolveRequestTenant()
  if (resolution.kind === 'tenant') return resolution.slug
  notFound()
}

export async function getPublishedCompanyBySlug(slug: string): Promise<Company | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'companies',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'active' } },
        { publicationStatus: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs[0] as Company | undefined) ?? null
}

/**
 * Also match by normalized subdomain when slug lookup fails (routing field).
 */
export async function getPublishedCompanyBySubdomain(subdomain: string): Promise<Company | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'companies',
    where: {
      and: [
        { subdomain: { equals: subdomain } },
        { status: { equals: 'active' } },
        { publicationStatus: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return (result.docs[0] as Company | undefined) ?? null
}

export async function requirePublishedTenant(): Promise<Company> {
  const resolution = await resolveRequestTenant()
  if (resolution.kind !== 'tenant') notFound()

  const bySlug = await getPublishedCompanyBySlug(resolution.slug)
  if (bySlug) return bySlug

  const bySubdomain = await getPublishedCompanyBySubdomain(resolution.slug)
  if (bySubdomain) return bySubdomain

  notFound()
}

export async function getCompanyById(
  id: string | number,
  user?: { id: string | number } | null,
) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'companies',
    id,
    depth: 0,
    user: user ?? undefined,
    overrideAccess: !user,
  })
}

export function getRequestHostnameSync(hostHeader: string | null): string {
  return normalizeHostname(hostHeader || '')
}
