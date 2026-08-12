import type { Metadata } from 'next'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedShareStructure } from '@/lib/public-data'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'Share structure',
    'Published share structure figures and source references for investors.',
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value))
}

function formatShares(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-CA').format(value)
}

export default async function ShareStructurePage() {
  const company = await requirePublishedTenant()
  const shareStructure = await getPublishedShareStructure(company.id)

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Share structure
        </p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Capitalization</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Latest published share structure only. Draft and review figures stay in the company
          dashboard.
        </p>

        {!shareStructure ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">No published share structure yet</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              When the company publishes share structure figures, they will appear here.
            </p>
          </div>
        ) : (
          <>
            <dl className="mt-12 grid gap-6 border-y border-[color-mix(in_oklab,var(--ink)_12%,transparent)] py-8 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">As of</dt>
                <dd className="mt-1 text-xl">{formatDate(shareStructure.asOfDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">Shares outstanding</dt>
                <dd className="mt-1 text-xl">
                  {formatShares(shareStructure.sharesOutstanding)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">Options</dt>
                <dd className="mt-1 text-xl">{formatShares(shareStructure.options)}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">Warrants</dt>
                <dd className="mt-1 text-xl">{formatShares(shareStructure.warrants)}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-soft)]">Fully diluted</dt>
                <dd className="mt-1 text-xl">{formatShares(shareStructure.fullyDiluted)}</dd>
              </div>
            </dl>

            {shareStructure.marketCapNote ? (
              <div className="mt-10 max-w-3xl">
                <h2 className="display text-3xl">Notes</h2>
                <p className="mt-3 text-[var(--ink-soft)] whitespace-pre-wrap">
                  {shareStructure.marketCapNote}
                </p>
              </div>
            ) : null}

            {shareStructure.sourceUrl ? (
              <div className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  Source
                </h2>
                <p className="mt-3">
                  <a
                    href={shareStructure.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-6 items-center"
                  >
                    View source document
                  </a>
                </p>
              </div>
            ) : null}
          </>
        )}

        <p className="mt-12 max-w-3xl border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] pt-8 text-sm text-[var(--ink-soft)]">
          Demo note: figures shown for {company.displayName} are fictional seed data for platform
          demonstration only and are not investment advice.
        </p>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
