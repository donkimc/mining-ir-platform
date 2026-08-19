import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'
import { relationId } from '@/lib/publishing'

import { ExplorationForm } from '../ExplorationForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditExplorationPage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let content
  try {
    content = await payload.findByID({
      collection: 'exploration-contents',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(content.tenant)) !== String(tenantId)) {
    notFound()
  }

  const projects = await listTenantProjects(tenantId, user)
  return (
    <ExplorationForm
      mode="edit"
      contentId={String(content.id)}
      initial={content as never}
      projects={projects}
    />
  )
}
