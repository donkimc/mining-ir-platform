import Link from 'next/link'

import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'
import { requirePublishedTenant } from '@/lib/tenant'

async function Placeholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const company = await requirePublishedTenant()
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <SiteHeader companyName={company.displayName} />
      <div className="section-shell py-20">
        <h1 className="display text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">{description}</p>
        <Link href="/" className="btn btn-dark mt-8 no-underline">
          Back to home
        </Link>
      </div>
      <SiteFooter companyName={company.displayName} irEmail={company.irContactEmail} />
    </main>
  )
}

export default async function NewsPlaceholderPage() {
  return (
    <Placeholder
      title="News"
      description="News releases and disclosure workflows are planned for Sprint 2. This route is a navigation placeholder only."
    />
  )
}
