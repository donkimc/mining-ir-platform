import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { buildTenantMetadata } from '@/lib/seo'
import { requirePublishedTenant } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  return buildTenantMetadata(
    'News',
    'News releases and disclosure workflows are planned for a later sprint.',
  )
}

export default async function NewsPlaceholderPage() {
  const company = await requirePublishedTenant()
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div className="section-shell py-20">
        <h1 className="display text-5xl">News</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          News releases and disclosure workflows are planned for Sprint 2. This route is a
          navigation placeholder only.
        </p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back to home
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}
