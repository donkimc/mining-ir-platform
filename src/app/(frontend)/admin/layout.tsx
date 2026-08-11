import Link from 'next/link'

import { requirePlatformAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin()

  return (
    <div className="min-h-screen bg-[#101418] text-[#e8eef2]">
      <header className="border-b border-white/15">
        <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9db0bc]">Platform Admin</p>
            <p className="display text-2xl text-white">Mining IR Control</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>{user.email}</span>
            <Link href="/admin/tenants" className="underline">
              Tenants
            </Link>
            <Link href="/admin/users" className="underline">
              Users
            </Link>
            <Link href="/cms" className="underline">
              CMS
            </Link>
            <Link href="/logout" className="border border-white/30 px-3 py-2 no-underline">
              Log out
            </Link>
          </div>
        </div>
      </header>
      <div id="main-content" tabIndex={-1} className="section-shell py-10">
        {children}
      </div>
    </div>
  )
}
