import Link from 'next/link'

export function SiteFooter({
  companyName,
  irEmail,
}: {
  companyName: string
  irEmail?: string | null
}) {
  return (
    <footer className="border-t border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-[var(--forest-deep)] text-[var(--paper)]">
      <div className="section-shell grid gap-6 py-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="display text-3xl">{companyName}</p>
          <p className="mt-3 max-w-md text-sm text-[var(--paper-deep)]">
            Investor relations website powered by Mining IR Platform. Sprint 1 Explorer template.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">IR Contact</p>
          {irEmail ? (
            <a className="mt-2 inline-block" href={`mailto:${irEmail}`}>
              {irEmail}
            </a>
          ) : (
            <p className="mt-2 text-[var(--paper-deep)]">Contact details coming soon.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/projects" className="inline-flex min-h-6 items-center">
              Projects
            </Link>
            <Link href="/contact" className="inline-flex min-h-6 items-center">
              Contact
            </Link>
            <Link href="/login" className="inline-flex min-h-6 items-center">
              Company login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
