import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import {
  getPublishedDocuments,
  getPublishedHighlights,
  getPublishedListings,
  getPublishedShareStructure,
} from '@/lib/public-data'
import { buildTenantMetadata } from '@/lib/seo'
import { resolveTemplateKey, templateShellClass } from '@/lib/templates'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'Investors',
    'Listings, share structure and published investor materials. No investor accounts or market data.',
  )
}

export default async function InvestorsPage() {
  const company = await requirePublishedTenant()
  const template = resolveTemplateKey(company)
  const [listings, shareStructure, highlights, documents] = await Promise.all([
    getPublishedListings(company.id),
    getPublishedShareStructure(company.id),
    getPublishedHighlights(company.id),
    getPublishedDocuments(company.id),
  ])

  return (
    <main className={`min-h-screen bg-[var(--paper)] ${templateShellClass(template)}`}>
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-20">
        <h1 className="display text-5xl">Investors</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published listings and capital-structure information for this fictional demo issuer.
          Investor accounts, CRM, alerts and live market data are out of scope.
        </p>

        <section className="mt-14">
          <h2 className="display text-3xl">Listings</h2>
          {listings.length === 0 ? (
            <p className="mt-4 text-[var(--ink-soft)]">
              {company.tickerSymbol && company.exchange
                ? `${company.tickerSymbol}:${company.exchange}`
                : 'No published listings yet.'}
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {listings.map((listing) => (
                <li key={listing.id} className="text-lg">
                  <span className="font-medium">
                    {listing.symbol}:{listing.exchange}
                  </span>
                  {listing.isPrimary ? (
                    <span className="ml-2 text-sm text-[var(--ink-soft)]">Primary</span>
                  ) : null}
                  {listing.market ? (
                    <span className="ml-2 text-sm text-[var(--ink-soft)]">{listing.market}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14">
          <h2 className="display text-3xl">Highlights</h2>
          {highlights.length === 0 ? (
            <p className="mt-4 text-[var(--ink-soft)]">No published highlights.</p>
          ) : (
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {highlights.map((item) => (
                <li key={item.id}>
                  <h3 className="text-xl font-medium">{item.title}</h3>
                  <p className="mt-2 text-[var(--ink-soft)]">{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14">
          <h2 className="display text-3xl">Share structure</h2>
          {shareStructure ? (
            <dl className="mt-6 grid max-w-xl gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">As of</dt>
                <dd>{shareStructure.asOfDate}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">Shares outstanding</dt>
                <dd>
                  {shareStructure.sharesOutstanding != null
                    ? new Intl.NumberFormat('en-CA').format(shareStructure.sharesOutstanding)
                    : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-[var(--ink-soft)]">No published share structure.</p>
          )}
          <Link href="/share-structure" className="mt-4 inline-block underline">
            Full share structure
          </Link>
        </section>

        <section className="mt-14">
          <h2 className="display text-3xl">Documents</h2>
          {documents.length === 0 ? (
            <p className="mt-4 text-[var(--ink-soft)]">No published documents.</p>
          ) : (
            <ul className="mt-6 space-y-2">
              {documents.slice(0, 8).map((doc) => (
                <li key={doc.id}>
                  <Link href="/documents" className="underline">
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
