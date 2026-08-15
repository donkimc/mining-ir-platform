import { FullPageNavLink } from '@/components/FullPageNavLink'
import { requireCompanyAdmin } from '@/lib/auth'
import { getCompanyById } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/company', label: 'Company profile' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/news', label: 'News' },
  { href: '/dashboard/documents', label: 'Documents' },
  { href: '/dashboard/management', label: 'Management' },
  { href: '/dashboard/share-structure', label: 'Share structure' },
  { href: '/dashboard/exploration', label: 'Exploration' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenantId } = await requireCompanyAdmin()
  const company = await getCompanyById(tenantId, user)

  return (
    <div className="min-h-screen bg-[var(--paper-deep)]">
      <header className="border-b border-[color-mix(in_oklab,var(--ink)_14%,transparent)] bg-white">
        <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              Company Admin
            </p>
            <p className="display text-2xl">{company.displayName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>{user.email}</span>
            <FullPageNavLink href="/" className="underline">
              Public site
            </FullPageNavLink>
            <FullPageNavLink href="/logout" className="btn btn-dark no-underline">
              Log out
            </FullPageNavLink>
          </div>
        </div>
        <nav aria-label="Dashboard" className="section-shell flex flex-wrap gap-4 pb-4 text-sm font-semibold">
          {links.map((link) => (
            <FullPageNavLink key={link.href} href={link.href} className="no-underline hover:underline">
              {link.label}
            </FullPageNavLink>
          ))}
          <span className="text-[var(--ink-soft)]">Settings (placeholder)</span>
        </nav>
      </header>
      <div id="main-content" tabIndex={-1} className="section-shell py-10">
        {children}
      </div>
    </div>
  )
}
