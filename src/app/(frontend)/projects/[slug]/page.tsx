import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import {
  getPublishedExplorationForProject,
  getPublishedProjectBySlug,
} from '@/lib/public-data'
import { requirePublishedTenant } from '@/lib/tenant'

type Props = {
  params: Promise<{ slug: string }>
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await requirePublishedTenant()
  const project = await getPublishedProjectBySlug(company.id, slug)
  if (!project) {
    return { title: 'Project not found' }
  }
  return {
    title: `${project.name} · ${company.displayName}`,
    description: project.summary || `Project detail for ${project.name}`,
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const company = await requirePublishedTenant()
  const project = await getPublishedProjectBySlug(company.id, slug)
  if (!project) notFound()

  const exploration = await getPublishedExplorationForProject(company.id, project.id)

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <article id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          <Link href="/projects">Projects</Link> / {project.slug}
        </p>
        <h1 className="display mt-3 text-5xl md:text-7xl">{project.name}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--ink-soft)]">{project.summary}</p>

        <dl className="mt-10 grid gap-6 border-y border-[color-mix(in_oklab,var(--ink)_12%,transparent)] py-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <dt className="text-sm text-[var(--ink-soft)]">Commodity</dt>
            <dd className="mt-1 text-xl">{project.commodity || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--ink-soft)]">Jurisdiction</dt>
            <dd className="mt-1 text-xl">{project.jurisdiction || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--ink-soft)]">Stage</dt>
            <dd className="mt-1 text-xl">{project.stage?.replaceAll('_', ' ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--ink-soft)]">Ownership</dt>
            <dd className="mt-1 text-xl">
              {project.ownershipPercent != null ? `${project.ownershipPercent}%` : '—'}
            </dd>
          </div>
        </dl>

        <section className="mt-12 grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="display text-3xl">Location</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              {project.locationSummary || 'Location summary will appear when published.'}
            </p>

            <h2 className="display mt-10 text-3xl">Exploration highlights</h2>
            {project.highlights && project.highlights.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink-soft)]">
                {project.highlights.map((item, index) => (
                  <li key={`${item.item}-${index}`}>{item.item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[var(--ink-soft)]">No published highlights yet.</p>
            )}

            {project.technicalSummary ? (
              <div className="mt-10">
                <h2 className="display text-3xl">
                  Technical summary{' '}
                  <a
                    href="#sources"
                    className="text-base font-normal text-[var(--accent)] no-underline"
                  >
                    (sources)
                  </a>
                </h2>
                <p className="mt-3 text-[var(--ink-soft)]">{project.technicalSummary}</p>
                <div id="sources" className="mt-6 scroll-mt-24">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    Source documents
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Material technical claims should be read with these source documents.
                  </p>
                  {project.sourceLinks && project.sourceLinks.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {project.sourceLinks.map((link, index) => (
                        <li key={`${link.url}-${index}`}>
                          <a href={link.url} target="_blank" rel="noreferrer">
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--ink-soft)]">No source links published.</p>
                  )}
                </div>
              </div>
            ) : project.sourceLinks && project.sourceLinks.length > 0 ? (
              <div id="sources" className="mt-10 scroll-mt-24">
                <h2 className="display text-3xl">Source documents</h2>
                <ul className="mt-4 space-y-2">
                  {project.sourceLinks.map((link, index) => (
                    <li key={`${link.url}-${index}`}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-12">
              <h2 className="display text-3xl">Exploration</h2>
              {exploration.length === 0 ? (
                <p className="mt-4 text-[var(--ink-soft)]">
                  No published exploration content for this project yet.
                </p>
              ) : (
                <ul className="mt-6 space-y-8">
                  {exploration.map((item) => (
                    <li
                      key={item.id}
                      className="border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] pt-6"
                    >
                      <p className="text-sm uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        {formatDate(item.contentDate)}
                      </p>
                      <h3 className="display mt-2 text-2xl">{item.title}</h3>
                      <p className="mt-3 text-[var(--ink-soft)]">{item.summary}</p>
                      <p className="mt-4 whitespace-pre-wrap text-[var(--ink-soft)]">
                        {item.technicalDetails}
                      </p>
                      {item.sourceUrl ? (
                        <p className="mt-4 text-sm">
                          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                            Source for these claims
                          </a>
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-[var(--ink-soft)]">
                          No source link published for these claims.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-8">
            <div className="border border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-[var(--paper-deep)] p-6">
              <h2 className="display text-2xl">Map</h2>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                Interactive map placeholder for Sprint 1.
                {project.latitude != null && project.longitude != null
                  ? ` Approximate coordinates: ${project.latitude}, ${project.longitude}.`
                  : ''}
              </p>
              <div
                aria-hidden="true"
                className="mt-4 h-48 bg-[linear-gradient(135deg,#1f3a2e,#0f1c16_55%,#c4a35a33)]"
              />
            </div>

            <div>
              <h2 className="display text-2xl">Source index</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Full source list lives beside the technical summary.
              </p>
              {project.sourceLinks && project.sourceLinks.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {project.sourceLinks.map((link, index) => (
                    <li key={`index-${link.url}-${index}`}>
                      <a href="#sources">{link.label}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">No source links published.</p>
              )}
            </div>

            <div>
              <h2 className="display text-2xl">Related content</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/news">News releases</Link>
                </li>
                <li>
                  <Link href="/documents">Documents</Link>
                </li>
                <li>
                  <Link href="/share-structure">Share structure</Link>
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </article>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
