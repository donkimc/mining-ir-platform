import type { Metadata } from 'next'

import { requirePublishedTenant } from '@/lib/tenant'

export async function buildTenantMetadata(
  pageTitle: string,
  description?: string,
): Promise<Metadata> {
  const company = await requirePublishedTenant()
  return {
    title: `${pageTitle} · ${company.displayName}`,
    description: description || company.shortDescription,
  }
}
