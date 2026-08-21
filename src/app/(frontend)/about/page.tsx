import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { buildTenantMetadata } from '@/lib/seo'
import { resolveTemplateKey, templateShellClass } from '@/lib/templates'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata('About', 'Company overview and investment thesis.')
}

export default async function AboutPage() {
  const company = await requirePublishedTenant()
  if (!company) notFound()
  const template = resolveTemplateKey(company)

  return (
    <main className={`min-h-screen bg-[var(--paper)] ${templateShellClass(template)}`}>
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-20">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">About</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">{company.displayName}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--ink-soft)]">
          {company.longDescription || company.shortDescription}
        </p>
        {company.investmentThesis ? (
          <section className="mt-14 max-w-3xl">
            <h2 className="display text-3xl">Investment thesis</h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--ink-soft)]">
              {company.investmentThesis}
            </p>
          </section>
        ) : null}
        <dl className="mt-14 grid max-w-3xl gap-6 md:grid-cols-2">
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              Commodity
            </dt>
            <dd className="mt-2 text-lg">{company.primaryCommodity || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              Jurisdiction
            </dt>
            <dd className="mt-2 text-lg">{company.jurisdiction || '—'}</dd>
          </div>
        </dl>
        <p className="mt-10 max-w-3xl text-sm text-[var(--ink-soft)]">
          Fictional demo content for the Mining IR Platform. Not investment advice.
        </p>
        <Link href="/projects" className="btn btn-dark mt-8 no-underline">
          View projects
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
