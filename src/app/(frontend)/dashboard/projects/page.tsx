import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardProjectsPage() {
  const { tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const projects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: tenantId } },
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Projects</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage tenant projects. Public pages show Published only.
          </p>
        </div>
        <Link href="/dashboard/projects/new" className="btn btn-dark no-underline">
          New project
        </Link>
      </div>

      {projects.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No projects yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">Create the first project for this tenant.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {projects.docs.map((project) => (
            <li key={project.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  {project.name}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">/{project.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={project.status} />
                <Link href={`/dashboard/projects/${project.id}`} className="text-sm font-semibold">
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
