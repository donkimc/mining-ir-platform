import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardNewsPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const news = await payload.find({
    collection: 'news-releases',
    where: { tenant: { equals: tenantId } },
    sort: '-releaseDate',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">News</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage news releases. Public pages show Published only.
          </p>
        </div>
        <Link href="/dashboard/news/new" className="btn btn-dark no-underline">
          New news release
        </Link>
      </div>

      {news.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No news releases yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Create the first news release for this tenant.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {news.docs.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/news/${item.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">/{item.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <Link href={`/dashboard/news/${item.id}`} className="text-sm font-semibold">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
