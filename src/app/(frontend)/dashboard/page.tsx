import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { getCompanyById } from '@/lib/tenant'

export default async function DashboardOverviewPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const company = await getCompanyById(tenantId, user)
  const payload = await getPayloadClient()

  const projects = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: tenantId } },
    limit: 20,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-4xl">Dashboard</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Edit tenant-scoped content, then move disclosure through Review before publishing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel">
          <p className="text-sm text-[var(--ink-soft)]">Company publication</p>
          <div className="mt-3">
            <StatusBadge status={company.publicationStatus} />
          </div>
        </div>
        <div className="panel">
          <p className="text-sm text-[var(--ink-soft)]">Projects</p>
          <p className="mt-3 display text-3xl">{projects.totalDocs}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-[var(--ink-soft)]">Public preview</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="display text-2xl">Next steps</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink-soft)]">
          <li>
            Update <Link href="/dashboard/company">company profile</Link> fields.
          </li>
          <li>
            Create or edit <Link href="/dashboard/projects">projects</Link>.
          </li>
          <li>Submit disclosure-sensitive changes for Review, then approve to Published.</li>
        </ul>
      </div>
    </div>
  )
}
