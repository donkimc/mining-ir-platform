import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { requirePublishedTenant } from '@/lib/tenant'

export default async function ContactPlaceholderPage() {
  const company = await requirePublishedTenant()
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div className="section-shell py-20">
        <h1 className="display text-5xl">Contact</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Contact form submission is out of scope for Sprint 1. Reach IR directly
          {company.irContactEmail ? (
            <>
              {' '}
              at <a href={`mailto:${company.irContactEmail}`}>{company.irContactEmail}</a>
            </>
          ) : (
            '.'
          )}
        </p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back to home
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
