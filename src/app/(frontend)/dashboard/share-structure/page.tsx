import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardShareStructurePage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const records = await payload.find({
    collection: 'share-structures',
    where: { tenant: { equals: tenantId } },
    sort: '-asOfDate',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Share structure</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage share structure records. Public pages show Published only.
          </p>
        </div>
        <Link href="/dashboard/share-structure/new" className="btn btn-dark no-underline">
          New share structure
        </Link>
      </div>

      {records.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No share structure records yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Create the first share structure record for this tenant.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {records.docs.map((record) => (
            <li key={record.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/share-structure/${record.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  As of {String(record.asOfDate || '').slice(0, 10)}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">
                  Outstanding:{' '}
                  {record.sharesOutstanding != null
                    ? Number(record.sharesOutstanding).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={record.status} />
                <Link
                  href={`/dashboard/share-structure/${record.id}`}
                  className="text-sm font-semibold"
                >
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
