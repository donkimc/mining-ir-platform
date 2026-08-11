import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { requirePublishedTenant } from '@/lib/tenant'

export const metadata: Metadata = {
  title: 'Not found',
}

export default async function NotFound() {
  let companyName = 'Mining IR'
  let irEmail: string | null = null
  try {
    const company = await requirePublishedTenant()
    companyName = company.displayName
    irEmail = company.irContactEmail || null
  } catch {
    // Tenant may be unpublished during local setup.
  }

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={companyName} />
      <div className="section-shell py-24">
        <h1 className="display text-5xl">Page not found</h1>
        <p className="mt-4 max-w-xl text-[var(--ink-soft)]">
          The page may not exist, or the content is not published for public investors.
        </p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back home
        </Link>
      </div>
      <SiteFooter companyName={companyName} irEmail={irEmail} />
    </main>
  )
}
