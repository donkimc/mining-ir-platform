import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { buildTenantMetadata } from '@/lib/seo'
import { resolveTemplateKey, templateShellClass } from '@/lib/templates'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata('Contact', 'Investor relations contact details for this company.')
}

export default async function ContactPage() {
  const company = await requirePublishedTenant()
  const template = resolveTemplateKey(company)

  return (
    <main className={`min-h-screen bg-[var(--paper)] ${templateShellClass(template)}`}>
      <SiteHeader companyName={company.displayName} />
      <div id="main-content" tabIndex={-1} className="section-shell py-20">
        <h1 className="display text-5xl">Contact</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Public contact forms and investor PII collection are out of scope. Use the IR details
          below for this fictional demo tenant.
        </p>
        <dl className="mt-10 max-w-xl space-y-6 text-lg">
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">IR contact</dt>
            <dd className="mt-2">{company.irContactName || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">Email</dt>
            <dd className="mt-2">
              {company.irContactEmail ? (
                <a href={`mailto:${company.irContactEmail}`}>{company.irContactEmail}</a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">Phone</dt>
            <dd className="mt-2">{company.irContactPhone || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm uppercase tracking-[0.16em] text-[var(--ink-soft)]">Office</dt>
            <dd className="mt-2 whitespace-pre-line">{company.officeAddress || '—'}</dd>
          </div>
        </dl>
        <Link href="/" className="btn btn-dark mt-10 no-underline">
          Back to home
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
