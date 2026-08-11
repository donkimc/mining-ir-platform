'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/news', label: 'News' },
  { href: '/investors', label: 'Investors' },
  { href: '/corporate', label: 'Corporate' },
  { href: '/contact', label: 'Contact' },
]

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader({
  companyName,
  tone = 'light',
}: {
  companyName: string
  tone?: 'light' | 'dark'
}) {
  const pathname = usePathname() || '/'
  const color = tone === 'dark' ? 'text-[var(--paper)]' : 'text-[var(--ink)]'

  return (
    <header className={`relative z-10 ${color}`}>
      <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-5">
        <Link href="/" className="display text-2xl tracking-tight no-underline md:text-3xl">
          {companyName}
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {links.map((link) => {
            const current = isCurrentPath(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-6 min-w-6 items-center px-2 py-1 no-underline hover:underline"
                aria-current={current ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
          <Link href="/login" className="btn btn-primary no-underline">
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
