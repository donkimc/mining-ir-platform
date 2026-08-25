import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { publicDocumentOpenHref } from '@/lib/document-links'

import { formatShares, type TenantHomeProps } from './home-shared'

/**
 * Summit homepage — denser corporate IR shell (ADR-0017 / S6-4).
 * Distinct from Explorer: ticker masthead, shorter top-aligned hero, metric rail,
 * flagship-first body, numbered highlights, single-column thesis, stacked news rail.
 */
export function SummitHome({ data, ticker }: TenantHomeProps) {
  const { company } = data

  return (
    <>
      <div className="hero-plane summit-hero" data-template-region="summit-hero">
        <div className="summit-ticker-bar" aria-label="Listing">
          <div className="section-shell flex flex-wrap items-center justify-between gap-2 py-2 text-xs uppercase tracking-[0.2em] text-[var(--mineral-soft)]">
            <span>{ticker}</span>
            <span className="text-[var(--paper-deep)]">
              {[company.primaryCommodity, company.jurisdiction].filter(Boolean).join(' · ') ||
                'Investor relations'}
            </span>
          </div>
        </div>
        <SiteHeader companyName={company.displayName} tone="dark" variant="summit" />
        <div
          id="main-content"
          tabIndex={-1}
          className="section-shell summit-hero-copy relative flex flex-1 flex-col justify-start pb-10 pt-8 md:pt-12"
        >
          <p className="fade-up summit-kicker text-xs uppercase tracking-[0.28em] text-[var(--mineral-soft)]">
            Corporate presentation
          </p>
          <h1 className="display fade-up mt-3 max-w-3xl text-5xl leading-[0.95] md:text-6xl lg:text-7xl">
            {company.displayName}
          </h1>
          <p className="fade-up-delay mt-5 max-w-xl text-base leading-relaxed text-[var(--paper-deep)] md:text-lg">
            {company.shortDescription}
          </p>
          <div className="fade-up-delay mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/investors" className="btn btn-primary no-underline">
              Investor overview
            </Link>
            <Link
              href="/projects"
              className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--paper)] underline-offset-4 hover:underline"
            >
              Projects
            </Link>
            <Link
              href="/documents"
              className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--paper)] underline-offset-4 hover:underline"
            >
              Documents
            </Link>
          </div>
        </div>
        <div className="summit-metric-rail" data-template-region="summit-metric-rail">
          <dl className="section-shell grid grid-cols-2 gap-6 py-6 md:grid-cols-5">
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
                Commodity
              </dt>
              <dd className="mt-1 text-sm font-semibold md:text-base">
                {company.primaryCommodity || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
                Jurisdiction
              </dt>
              <dd className="mt-1 text-sm font-semibold md:text-base">
                {company.jurisdiction || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
                Stage
              </dt>
              <dd className="mt-1 text-sm font-semibold md:text-base">
                {data.flagship?.stage?.replaceAll('_', ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
                Ownership
              </dt>
              <dd className="mt-1 text-sm font-semibold md:text-base">
                {data.flagship?.ownershipPercent != null
                  ? `${data.flagship.ownershipPercent}%`
                  : '—'}
              </dd>
            </div>
            <div className="col-span-2 md:col-span-1">
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--mineral-soft)]">
                Shares outstanding
              </dt>
              <dd className="mt-1 text-sm font-semibold md:text-base">
                {formatShares(data.shareStructure?.sharesOutstanding)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section
        className="summit-section bg-[var(--forest)] py-16 text-[var(--paper)] md:py-20"
        data-template-region="summit-flagship"
      >
        <div className="section-shell">
          <div className="summit-section-rule mb-8" />
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--mineral-soft)]">
            Flagship project
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h2 className="display text-4xl md:text-5xl">
                {data.flagship?.name ?? 'Flagship coming soon'}
              </h2>
              <p className="mt-5 max-w-2xl text-[var(--paper-deep)]">
                {data.flagship?.summary ?? 'Published flagship project details will appear here.'}
              </p>
            </div>
            {data.flagship ? (
              <div className="lg:justify-self-end">
                <Link
                  href={`/projects/${data.flagship.slug}`}
                  className="btn btn-primary no-underline"
                >
                  Open project brief
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="summit-section bg-[var(--paper)] py-16 md:py-20"
        data-template-region="summit-highlights"
      >
        <div className="section-shell">
          <h2 className="display text-3xl md:text-4xl">Investment highlights</h2>
          {data.highlights.length === 0 ? (
            <p className="mt-6 text-[var(--ink-soft)]">Highlights will appear once published.</p>
          ) : (
            <ol className="summit-highlight-list mt-10">
              {data.highlights.map((item, index) => (
                <li key={item.id} className="summit-highlight-item">
                  <span className="summit-highlight-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="display text-xl md:text-2xl">{item.title}</h3>
                    <p className="mt-2 text-[var(--ink-soft)]">{item.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section
        className="summit-section bg-[var(--paper-deep)] py-16 md:py-20"
        data-template-region="summit-thesis"
      >
        <div className="section-shell max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Investment thesis
          </p>
          <h2 className="display mt-3 text-3xl md:text-4xl">Why {company.displayName}</h2>
          <p className="summit-thesis-body mt-8 text-lg leading-relaxed text-[var(--ink-soft)]">
            {company.investmentThesis || company.longDescription || company.shortDescription}
          </p>
        </div>
      </section>

      <section className="summit-section py-16 md:py-20" data-template-region="summit-feed">
        <div className="section-shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="display text-3xl">Catalysts</h2>
            {data.catalysts.length === 0 ? (
              <p className="mt-4 text-[var(--ink-soft)]">No published catalysts yet.</p>
            ) : (
              <ul className="mt-8 space-y-0">
                {data.catalysts.map((item) => (
                  <li key={item.id} className="summit-feed-row">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                      {item.expectedTiming || 'Timing TBD'}
                    </p>
                    <h3 className="display mt-1 text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="display text-3xl">Newsroom</h2>
              <Link href="/news" className="text-sm font-semibold no-underline hover:underline">
                All releases
              </Link>
            </div>
            {data.recentNews.length === 0 ? (
              <p className="mt-4 text-[var(--ink-soft)]">No published news releases yet.</p>
            ) : (
              <ul className="mt-8 space-y-0">
                {data.recentNews.map((item) => (
                  <li key={item.id} className="summit-feed-row">
                    <h3 className="display text-xl">
                      <Link href={`/news/${item.slug}`} className="no-underline hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.excerpt}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="summit-doc-rail mt-10">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Documents & capitalization
              </h3>
              {data.documents.length === 0 ? (
                <p className="mt-3 text-[var(--ink-soft)]">
                  Published documents will appear in the document library.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.documents.map((doc) => {
                    const href = publicDocumentOpenHref(doc)
                    return (
                      <li key={doc.id}>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            {doc.title}
                          </a>
                        ) : (
                          <span>{doc.title}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                <Link href="/documents">Document library</Link>
                {' · '}
                <Link href="/share-structure">Share structure</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="summit-section summit-contact bg-[var(--ink)] py-14 text-[var(--paper)]"
        data-template-region="summit-contact"
      >
        <div className="section-shell max-w-2xl text-center">
          <h2 className="display text-3xl md:text-4xl">Investor relations</h2>
          <p className="mt-4 text-[var(--paper-deep)]">
            Contact investor relations for updates, or subscribe when the mailing list launches.
          </p>
          <Link href="/contact" className="btn btn-primary mt-8 no-underline">
            Contact IR
          </Link>
        </div>
      </section>

      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </>
  )
}
