import { requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'

import { DocumentForm } from '../DocumentForm'

export default async function NewDocumentPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const projects = await listTenantProjects(tenantId, user)
  return <DocumentForm mode="create" projects={projects} />
}
