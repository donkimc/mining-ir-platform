import Link from 'next/link'

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/news', label: 'News' },
  { href: '/investors', label: 'Investors' },
  { href: '/corporate', label: 'Corporate' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader({
  companyName,
  tone = 'light',
}: {
  companyName: string
  tone?: 'light' | 'dark'
}) {
  const color = tone === 'dark' ? 'text-[var(--paper)]' : 'text-[var(--ink)]'

  return (
    <header className={`relative z-10 ${color}`}>
      <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-5">
        <Link href="/" className="display text-2xl tracking-tight no-underline md:text-3xl">
          {companyName}
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="no-underline hover:underline">
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="btn btn-primary no-underline">
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
