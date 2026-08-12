import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardManagementPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const people = await payload.find({
    collection: 'people',
    where: { tenant: { equals: tenantId } },
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Management</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage team and board profiles. Public pages show Published only.
          </p>
        </div>
        <Link href="/dashboard/management/new" className="btn btn-dark no-underline">
          New team member
        </Link>
      </div>

      {people.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No team members yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Create the first management profile for this tenant.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {people.docs.map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/management/${person.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  {person.name}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">
                  {person.roleTitle} · {person.group}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={person.status} />
                <Link href={`/dashboard/management/${person.id}`} className="text-sm font-semibold">
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
