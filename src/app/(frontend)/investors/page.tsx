import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'Investors',
    'Investor accounts and CRM features are out of scope for Sprint 1.',
  )
}

export default async function InvestorsPlaceholderPage() {
  const company = await requirePublishedTenant()
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div className="section-shell py-20">
        <h1 className="display text-5xl">Investors</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Investor accounts and CRM features are out of scope for Sprint 1.
        </p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back to home
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
