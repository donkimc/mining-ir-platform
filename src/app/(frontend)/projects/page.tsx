import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicDiscoveryFilters } from '@/components/public/PublicDiscoveryFilters'
import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedProjects } from '@/lib/public-data'
import { requirePublishedTenant } from '@/lib/tenant'

type Props = {
  searchParams: Promise<{ q?: string; commodity?: string; stage?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const company = await requirePublishedTenant()
  return {
    title: `Projects · ${company.displayName}`,
    description: `Published exploration projects for ${company.displayName}.`,
  }
}

const STAGE_OPTIONS = [
  { value: '', label: 'Any stage' },
  { value: 'early_exploration', label: 'Early exploration' },
  { value: 'advanced_exploration', label: 'Advanced exploration' },
  { value: 'resource_definition', label: 'Resource definition' },
  { value: 'development', label: 'Development' },
  { value: 'production', label: 'Production' },
]

export default async function ProjectsPage({ searchParams }: Props) {
  const company = await requirePublishedTenant()
  const filters = await searchParams
  const projects = await getPublishedProjects(company.id, {
    q: filters.q,
    commodity: filters.commodity,
    stage: filters.stage,
  })
  const hasFilters = Boolean(filters.q?.trim() || filters.commodity?.trim() || filters.stage?.trim())

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Projects</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Exploration portfolio</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published projects only. Draft and review records stay in the company dashboard.
        </p>

        <PublicDiscoveryFilters
          action="/projects"
          fields={[
            {
              name: 'q',
              label: 'Search',
              type: 'search',
              placeholder: 'Name or summary',
              defaultValue: filters.q,
            },
            {
              name: 'commodity',
              label: 'Commodity',
              type: 'search',
              placeholder: 'e.g. Gold',
              defaultValue: filters.commodity,
            },
            {
              name: 'stage',
              label: 'Stage',
              type: 'select',
              defaultValue: filters.stage,
              options: STAGE_OPTIONS,
            },
          ]}
        />

        {projects.length === 0 ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">
              {hasFilters ? 'No matching published projects' : 'No published projects yet'}
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              {hasFilters
                ? 'Try clearing filters or using a different search term.'
                : 'When the company publishes a project, it will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
            {projects.map((project) => (
              <li key={project.id} className="grid gap-4 py-8 md:grid-cols-[1.4fr_1fr_auto]">
                <div>
                  <h2 className="display text-3xl">
                    <Link href={`/projects/${project.slug}`} className="no-underline hover:underline">
                      {project.name}
                    </Link>
                  </h2>
                  <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">{project.summary}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--ink-soft)]">Commodity</dt>
                    <dd>{project.commodity || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-soft)]">Stage</dt>
                    <dd>{project.stage?.replaceAll('_', ' ') || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-soft)]">Jurisdiction</dt>
                    <dd>{project.jurisdiction || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-soft)]">Ownership</dt>
                    <dd>
                      {project.ownershipPercent != null ? `${project.ownershipPercent}%` : '—'}
                    </dd>
                  </div>
                </dl>
                <div className="self-center">
                  <Link href={`/projects/${project.slug}`} className="btn btn-dark no-underline">
                    View detail
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
