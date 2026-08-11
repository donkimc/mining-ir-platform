import { notFound } from 'next/navigation'

import { getPayloadClient } from '@/lib/auth'
import type { Company } from '@/payload-types'

export function shouldAcceptTenantSlugHeader(args: {
  nodeEnv: string | undefined
  hasHeader: boolean
  trustedProxy: boolean
}): boolean {
  return args.hasHeader && (args.nodeEnv !== 'production' || args.trustedProxy)
}

/**
 * Sprint 1 tenant resolution:
 * 1. Optional `x-tenant-slug` header — only in non-production, or when a trusted proxy secret matches
 * 2. Subdomain label when not localhost
 * 3. `DEFAULT_TENANT_SLUG` for local single-hostname development
 */
export async function resolveTenantSlug(): Promise<string> {
  const { headers } = await import('next/headers')
  const headerStore = await headers()
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
    return fromHeader.trim().toLowerCase()
  }

  const host = headerStore.get('host') || ''
  const hostname = host.split(':')[0]

  if (
    hostname &&
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    hostname.includes('.')
  ) {
    const label = hostname.split('.')[0]
    if (label && label !== 'www') return label.toLowerCase()
  }

  const fallback = process.env.DEFAULT_TENANT_SLUG
  if (!fallback) {
    throw new Error('DEFAULT_TENANT_SLUG is required for local tenant resolution.')
  }
  return fallback.toLowerCase()
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

export async function requirePublishedTenant(): Promise<Company> {
  const slug = await resolveTenantSlug()
  const company = await getPublishedCompanyBySlug(slug)
  if (!company) notFound()
  return company
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
