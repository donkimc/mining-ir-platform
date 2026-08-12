import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardExplorationPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const contents = await payload.find({
    collection: 'exploration-contents',
    where: { tenant: { equals: tenantId } },
    sort: '-contentDate',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Exploration</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage exploration content and drill-result summaries. Public pages show Published only.
          </p>
        </div>
        <Link href="/dashboard/exploration/new" className="btn btn-dark no-underline">
          New exploration content
        </Link>
      </div>

      {contents.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No exploration content yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Create the first exploration record for this tenant.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {contents.docs.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/exploration/${item.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">
                  {String(item.contentDate || '').slice(0, 10)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <Link href={`/dashboard/exploration/${item.id}`} className="text-sm font-semibold">
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
