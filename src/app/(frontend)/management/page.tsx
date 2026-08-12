import type { Metadata } from 'next'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { getPublishedPeople } from '@/lib/public-data'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'Management',
    'Published management and board profiles for investors.',
  )
}

function formatGroup(group?: string | null) {
  if (!group) return '—'
  return group.replaceAll('_', ' ')
}

export default async function ManagementPage() {
  const company = await requirePublishedTenant()
  const people = await getPublishedPeople(company.id)

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-16">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Management</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Leadership team</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Published profiles only. Draft and review biographies stay in the company dashboard.
        </p>

        {people.length === 0 ? (
          <div className="mt-12 border border-dashed border-[color-mix(in_oklab,var(--ink)_25%,transparent)] p-8">
            <h2 className="display text-3xl">No published profiles yet</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              When the company publishes management profiles, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)]">
            {people.map((person) => (
              <li key={person.id} className="grid gap-4 py-8 md:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <h2 className="display text-3xl">{person.name}</h2>
                  <p className="mt-2 text-lg">{person.roleTitle}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    {formatGroup(person.group)}
                  </p>
                </div>
                <p className="text-[var(--ink-soft)] whitespace-pre-wrap">{person.biography}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
