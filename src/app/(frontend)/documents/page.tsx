import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedDocuments } from '@/lib/public-data'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'
import type { Document } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'Documents',
    'Published presentations, technical reports and investor documents.',
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value))
}

const CATEGORY_ORDER = ['presentation', 'technical_report', 'financial', 'other'] as const

const CATEGORY_LABELS: Record<(typeof CATEGORY_ORDER)[number], string> = {
  presentation: 'Presentations',
  technical_report: 'Technical reports',
  financial: 'Financial',
  other: 'Other',
}

function groupDocuments(documents: Document[]) {
  const groups = new Map<string, Document[]>()
  for (const category of CATEGORY_ORDER) {
    groups.set(category, [])
  }
  for (const doc of documents) {
    const key = CATEGORY_ORDER.includes(doc.category as (typeof CATEGORY_ORDER)[number])
      ? doc.category
      : 'other'
    const list = groups.get(key) ?? []
    list.push(doc)
    groups.set(key, list)
  }
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: groups.get(category) ?? [],
  })).filter((group) => group.items.length > 0)
}

export default async function DocumentsPage() {
  const company = await requirePublishedTenant()
  const documents = await getPublishedDocuments(company.id)
  const groups = groupDocuments(documents)

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Documents</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Investor documents</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published presentations and reports only. Draft and review files stay in the company
          dashboard.
        </p>

        {documents.length === 0 ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">No published documents yet</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              When the company publishes a document, it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {groups.map((group) => (
              <section key={group.category}>
                <h2 className="display text-3xl">{group.label}</h2>
                <ul className="mt-6 divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
                  {group.items.map((doc) => (
                    <li
                      key={doc.id}
                      className="grid gap-4 py-6 md:grid-cols-[1.4fr_1fr_auto]"
                    >
                      <div>
                        <h3 className="display text-2xl">{doc.title}</h3>
                        <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                          {doc.category.replaceAll('_', ' ')}
                        </p>
                      </div>
                      <dl className="text-sm">
                        <dt className="text-[var(--ink-soft)]">Publication date</dt>
                        <dd className="mt-1">{formatDate(doc.publicationDate)}</dd>
                      </dl>
                      <div className="self-center">
                        {doc.externalUrl ? (
                          <a
                            href={doc.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-dark no-underline"
                          >
                            Open document
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--ink-soft)]">Link unavailable</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="mt-12 text-sm text-[var(--ink-soft)]">
          Looking for share counts? See{' '}
          <Link href="/share-structure">share structure</Link>.
        </p>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
