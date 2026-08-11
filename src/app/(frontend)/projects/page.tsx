import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedProjects } from '@/lib/public-data'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const company = await requirePublishedTenant()
  return {
    title: `Projects · ${company.displayName}`,
    description: `Published exploration projects for ${company.displayName}.`,
  }
}

export default async function ProjectsPage() {
  const company = await requirePublishedTenant()
  const projects = await getPublishedProjects(company.id)

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Projects</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Exploration portfolio</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published projects only. Draft and review records stay in the company dashboard.
        </p>

        {projects.length === 0 ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">No published projects yet</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              When the company publishes a project, it will appear here.
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
