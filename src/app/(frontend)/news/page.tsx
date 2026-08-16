import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicDiscoveryFilters } from '@/components/public/PublicDiscoveryFilters'
import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedNews } from '@/lib/public-data'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'News',
    'Published news releases and disclosures for investors.',
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value))
}

export default async function NewsPage({ searchParams }: Props) {
  const company = await requirePublishedTenant()
  const filters = await searchParams
  const news = await getPublishedNews(company.id, { q: filters.q })
  const hasFilters = Boolean(filters.q?.trim())

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">News</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">News releases</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published releases only. Draft and review records stay in the company dashboard.
        </p>

        <PublicDiscoveryFilters
          action="/news"
          fields={[
            {
              name: 'q',
              label: 'Search',
              type: 'search',
              placeholder: 'Title or excerpt',
              defaultValue: filters.q,
            },
          ]}
        />

        {news.length === 0 ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">
              {hasFilters ? 'No matching published news' : 'No published news yet'}
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              {hasFilters
                ? 'Try clearing the search or using a different term.'
                : 'When the company publishes a news release, it will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
            {news.map((item) => (
              <li key={item.id} className="grid gap-4 py-8 md:grid-cols-[1.6fr_auto]">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    {formatDate(item.releaseDate)}
                  </p>
                  <h2 className="display mt-2 text-3xl">
                    <Link href={`/news/${item.slug}`} className="no-underline hover:underline">
                      {item.title}
                    </Link>
                  </h2>
                  <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">{item.excerpt}</p>
                </div>
                <div className="self-center">
                  <Link href={`/news/${item.slug}`} className="btn btn-dark no-underline">
                    Read release
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
