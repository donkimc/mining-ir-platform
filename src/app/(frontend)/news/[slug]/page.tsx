import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedNewsBySlug, getPublishedProjects } from '@/lib/public-data'
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
  const news = await getPublishedNewsBySlug(company.id, slug)
  if (!news) {
    return { title: 'News release not found' }
  }
  return {
    title: `${news.title} · ${company.displayName}`,
    description: news.excerpt || `News release from ${company.displayName}`,
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const company = await requirePublishedTenant()
  const news = await getPublishedNewsBySlug(company.id, slug)
  if (!news) notFound()

  const projects = await getPublishedProjects(company.id)
  const relatedProjectId =
    typeof news.project === 'object' && news.project ? news.project.id : news.project
  const relatedProject =
    relatedProjectId != null
      ? projects.find((project) => project.id === relatedProjectId) ?? null
      : null

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <article id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          <Link href="/news">News</Link> / {news.slug}
        </p>
        <h1 className="display mt-3 text-5xl md:text-7xl">{news.title}</h1>
        <p className="mt-5 text-lg text-[var(--ink-soft)]">{formatDate(news.releaseDate)}</p>
        <p className="mt-6 max-w-3xl text-lg text-[var(--ink-soft)]">{news.excerpt}</p>

        <div className="mt-10 max-w-3xl space-y-4 whitespace-pre-wrap text-[var(--ink-soft)]">
          {news.body}
        </div>

        {relatedProject ? (
          <p className="mt-10 text-sm text-[var(--ink-soft)]">
            Related project:{' '}
            <Link href={`/projects/${relatedProject.slug}`}>{relatedProject.name}</Link>
          </p>
        ) : relatedProjectId != null ? (
          <p className="mt-10 text-sm text-[var(--ink-soft)]">
            This release references a related project.
          </p>
        ) : null}

        {news.sourceUrl ? (
          <div className="mt-10 border-t border-[color-mix(in_oklab,var(--ink)_12%,transparent)] pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Source
            </h2>
            <p className="mt-3">
              <a href={news.sourceUrl} target="_blank" rel="noreferrer">
                View source document
              </a>
            </p>
          </div>
        ) : null}
      </article>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
