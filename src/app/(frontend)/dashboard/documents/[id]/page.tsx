import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'
import { relationId } from '@/lib/publishing'

import { DocumentForm } from '../DocumentForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditDocumentPage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let document
  try {
    document = await payload.findByID({
      collection: 'documents',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(document.tenant)) !== String(tenantId)) {
    notFound()
  }

  const projects = await listTenantProjects(tenantId, user)
  return (
    <DocumentForm
      mode="edit"
      documentId={String(document.id)}
      initial={document}
      projects={projects}
    />
  )
}
