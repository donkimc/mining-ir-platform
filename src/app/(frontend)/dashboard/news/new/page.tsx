import { requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'

import { NewsForm } from '../NewsForm'

export default async function NewNewsPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const projects = await listTenantProjects(tenantId, user)
  return <NewsForm mode="create" projects={projects} />
}
