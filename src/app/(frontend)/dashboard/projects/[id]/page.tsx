import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'

import { ProjectForm } from '../ProjectForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let project
  try {
    project = await payload.findByID({
      collection: 'projects',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const projectTenant =
    project.tenant && typeof project.tenant === 'object' ? project.tenant.id : project.tenant

  if (String(projectTenant) !== String(tenantId)) {
    notFound()
  }

  return <ProjectForm mode="edit" projectId={String(project.id)} initial={project} />
}
