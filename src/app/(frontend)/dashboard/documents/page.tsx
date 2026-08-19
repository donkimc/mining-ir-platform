import Link from 'next/link'

import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

export default async function DashboardDocumentsPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()
  const documents = await payload.find({
    collection: 'documents',
    where: { tenant: { equals: tenantId } },
    sort: '-publicationDate',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Documents</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Manage presentations and documents. Public pages show Published only. To attach a
            technical-report PDF, open a document and use the upload panel on the edit page.
          </p>
        </div>
        <Link href="/dashboard/documents/new" className="btn btn-dark no-underline">
          New document
        </Link>
      </div>

      {documents.docs.length === 0 ? (
        <div className="panel">
          <h2 className="display text-2xl">No documents yet</h2>
          <p className="mt-2 text-[var(--ink-soft)]">Create the first document for this tenant.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[color-mix(in_oklab,var(--ink)_12%,transparent)] border border-[color-mix(in_oklab,var(--ink)_12%,transparent)] bg-white">
          {documents.docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="display text-2xl no-underline hover:underline"
                >
                  {doc.title}
                </Link>
                <p className="text-sm text-[var(--ink-soft)]">
                  /{doc.slug} · {String(doc.category || '').replaceAll('_', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={doc.status} />
                <Link href={`/dashboard/documents/${doc.id}`} className="text-sm font-semibold">
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
