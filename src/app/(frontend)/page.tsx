import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublicHomeData } from '@/lib/public-data'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const company = await requirePublishedTenant()
  return {
    title: company.displayName,
    description: company.shortDescription,
  }
}

function formatShares(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-CA').format(value)
}

export default async function HomePage() {
  const company = await requirePublishedTenant()
  const data = await getPublicHomeData(company)
  const ticker =
    company.tickerSymbol && company.exchange
      ? `${company.tickerSymbol}:${company.exchange}`
      : company.tickerSymbol || 'Ticker placeholder'

  return (
    <main>
      <div className="hero-plane">
        <SiteHeader companyName={company.displayName} tone="dark" />
        <div className="section-shell relative flex min-h-[calc(100svh-5.5rem)] flex-col justify-end pb-16 pt-20">
          <p className="fade-up text-sm uppercase tracking-[0.22em] text-[var(--mineral-soft)]">
            {ticker}
          </p>
          <h1 className="display fade-up mt-4 max-w-4xl text-6xl leading-none md:text-8xl">
            {company.displayName}
          </h1>
          <p className="fade-up-delay mt-6 max-w-2xl text-lg text-[var(--paper-deep)] md:text-xl">
            {company.shortDescription}
          </p>
          <div className="fade-up-delay mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className="btn btn-primary no-underline">
              View projects
            </Link>
            <Link href="/contact" className="btn btn-secondary no-underline">
              Contact IR
            </Link>
          </div>
        </div>
      </div>

      <section className="bg-[var(--paper)] py-20">
        <div className="section-shell grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              Investment thesis
            </p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Why {company.displayName}</h2>
          </div>
          <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
            {company.investmentThesis || company.longDescription || company.shortDescription}
          </p>
        </div>
      </section>

      <section className="bg-[var(--paper-deep)] py-20">
        <div className="section-shell">
          <h2 className="display text-4xl">Investment highlights</h2>
          {data.highlights.length === 0 ? (
            <p className="mt-6 text-[var(--ink-soft)]">Highlights will appear once published.</p>
          ) : (
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {data.highlights.map((item) => (
                <li key={item.id}>
                  <h3 className="display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-[var(--ink-soft)]">{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-[var(--forest)] py-20 text-[var(--paper)]">
        <div className="section-shell grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--mineral-soft)]">
              Flagship project
            </p>
            <h2 className="display mt-3 text-5xl">
              {data.flagship?.name ?? 'Flagship coming soon'}
            </h2>
            <p className="mt-5 max-w-xl text-[var(--paper-deep)]">
              {data.flagship?.summary ??
                'Published flagship project details will appear here.'}
            </p>
            {data.flagship ? (
              <Link
                href={`/projects/${data.flagship.slug}`}
                className="btn btn-primary mt-8 no-underline"
              >
                Explore {data.flagship.name}
              </Link>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-6 self-end">
            <div>
              <dt className="text-sm text-[var(--mineral-soft)]">Commodity</dt>
              <dd className="mt-1 text-xl">{company.primaryCommodity || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--mineral-soft)]">Jurisdiction</dt>
              <dd className="mt-1 text-xl">{company.jurisdiction || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--mineral-soft)]">Project stage</dt>
              <dd className="mt-1 text-xl">
                {data.flagship?.stage?.replaceAll('_', ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--mineral-soft)]">Ownership</dt>
              <dd className="mt-1 text-xl">
                {data.flagship?.ownershipPercent != null
                  ? `${data.flagship.ownershipPercent}%`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--mineral-soft)]">Shares outstanding</dt>
              <dd className="mt-1 text-xl">
                {formatShares(data.shareStructure?.sharesOutstanding)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="display text-4xl">Upcoming catalysts</h2>
            {data.catalysts.length === 0 ? (
              <p className="mt-4 text-[var(--ink-soft)]">No published catalysts yet.</p>
            ) : (
              <ul className="mt-8 space-y-6">
                {data.catalysts.map((item) => (
                  <li key={item.id} className="border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] pt-4">
                    <p className="text-sm uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      {item.expectedTiming || 'Timing TBD'}
                    </p>
                    <h3 className="display mt-2 text-2xl">{item.title}</h3>
                    <p className="mt-2 text-[var(--ink-soft)]">{item.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="display text-4xl">Recent news</h2>
            <p className="mt-4 text-[var(--ink-soft)]">
              News workflow is out of scope for Sprint 1. This is a placeholder for upcoming
              releases.
            </p>
            <Link href="/news" className="mt-6 inline-block font-semibold">
              View news placeholder
            </Link>
            <div className="mt-10 border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] pt-8">
              <h3 className="display text-2xl">Corporate presentation</h3>
              <p className="mt-3 text-[var(--ink-soft)]">
                Document library arrives in a later sprint. Presentation link placeholder only.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] py-16 text-[var(--paper)]">
        <div className="section-shell flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="display text-4xl">Stay in touch</h2>
            <p className="mt-3 max-w-xl text-[var(--paper-deep)]">
              Contact investor relations for updates, or subscribe when the mailing list launches.
            </p>
          </div>
          <Link href="/contact" className="btn btn-primary no-underline">
            Contact / subscribe
          </Link>
        </div>
      </section>

      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
