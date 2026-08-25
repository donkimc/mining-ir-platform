import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { MarketingHome } from '@/components/marketing/MarketingHome'
import { TenantHome } from '@/components/templates/TenantHome'
import { getPublicHomeData } from '@/lib/public-data'
import { resolveTemplateKey } from '@/lib/templates'
import { requirePublishedTenant, resolveRequestTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const resolution = await resolveRequestTenant()
  if (resolution.kind === 'marketing') {
    return {
      title: 'Mining IR Platform',
      description:
        'Self-service investor relations websites for junior mining companies — tenant isolation, human approval and private media.',
    }
  }
  if (resolution.kind !== 'tenant') {
    return { title: 'Mining IR Platform' }
  }
  const company = await requirePublishedTenant()
  return {
    title: company.displayName,
    description: company.shortDescription,
  }
}

export default async function HomePage() {
  const resolution = await resolveRequestTenant()
  if (resolution.kind === 'marketing') {
    return <MarketingHome />
  }
  if (resolution.kind === 'admin') {
    redirect('/login')
  }
  if (resolution.kind !== 'tenant') {
    notFound()
  }

  const company = await requirePublishedTenant()
  const data = await getPublicHomeData(company)
  const template = resolveTemplateKey(company)
  const primaryListing =
    data.listings.find((listing) => listing.isPrimary) ?? data.listings[0] ?? null
  const ticker = primaryListing
    ? `${primaryListing.symbol}:${primaryListing.exchange}`
    : company.tickerSymbol && company.exchange
      ? `${company.tickerSymbol}:${company.exchange}`
      : company.tickerSymbol || 'Ticker placeholder'

  return <TenantHome template={template} data={data} ticker={ticker} />
}
