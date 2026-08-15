import type { ReactNode } from 'react'

type FullPageNavLinkProps = {
  href: string
  className?: string
  children: ReactNode
}

/**
 * Full document navigation for authenticated shells.
 * Next.js <Link> soft/RSC navigations were dropping the Payload session cookie
 * mid-click (login succeeded, then top-nav bounced to /login).
 */
export function FullPageNavLink({ href, className, children }: FullPageNavLinkProps) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
