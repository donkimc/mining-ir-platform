'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

const explorerLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/news', label: 'News' },
  { href: '/documents', label: 'Documents' },
  { href: '/management', label: 'Management' },
  { href: '/share-structure', label: 'Share structure' },
  { href: '/investors', label: 'Investors' },
  { href: '/contact', label: 'Contact' },
]

/** Summit primary nav — IR-first order and shorter label set (ADR-0017 / S6-4). */
const summitLinks = [
  { href: '/', label: 'Home' },
  { href: '/investors', label: 'Investors' },
  { href: '/projects', label: 'Projects' },
  { href: '/news', label: 'Newsroom' },
  { href: '/documents', label: 'Documents' },
  { href: '/management', label: 'Team' },
  { href: '/share-structure', label: 'Capital' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader({
  companyName,
  tone = 'light',
  variant = 'explorer',
}: {
  companyName: string
  tone?: 'light' | 'dark'
  variant?: 'explorer' | 'summit'
}) {
  const pathname = usePathname() || '/'
  const links = variant === 'summit' ? summitLinks : explorerLinks
  const color = tone === 'dark' ? 'text-[var(--paper)]' : 'text-[var(--ink)]'
  const menuSurface =
    tone === 'dark'
      ? 'bg-[color-mix(in_oklab,var(--forest-deep)_94%,black)] text-[var(--paper)]'
      : 'bg-[var(--paper)] text-[var(--ink)] shadow-sm'
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const brandClass =
    variant === 'summit'
      ? 'display text-xl tracking-[0.04em] no-underline md:text-2xl'
      : 'display text-2xl tracking-tight no-underline md:text-3xl'
  const navClass =
    variant === 'summit'
      ? `${
          menuOpen ? 'flex' : 'hidden'
        } absolute inset-x-0 top-full z-20 flex-col gap-1 border-b border-current/15 px-4 py-4 text-xs uppercase tracking-[0.14em] md:static md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none ${menuSurface} md:bg-transparent`
      : `${
          menuOpen ? 'flex' : 'hidden'
        } absolute inset-x-0 top-full z-20 flex-col gap-1 border-b border-current/15 px-4 py-4 text-sm md:static md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none ${menuSurface} md:bg-transparent`

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className={`relative z-10 ${color}`} data-nav-variant={variant}>
      <div
        className={`section-shell flex items-center justify-between gap-4 ${
          variant === 'summit' ? 'py-3' : 'py-5'
        }`}
      >
        <Link href="/" className={brandClass}>
          {companyName}
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-current/30 px-3 text-sm md:hidden"
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav id={menuId} aria-label="Primary" className={navClass}>
          {links.map((link) => {
            const current = isCurrentPath(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center px-2 py-2 no-underline hover:underline md:min-h-6 md:py-1"
                aria-current={current ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
          <Link href="/login" className="btn btn-primary mt-2 no-underline md:mt-0">
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
