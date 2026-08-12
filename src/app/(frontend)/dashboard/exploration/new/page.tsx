import { requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'

import { ExplorationForm } from '../ExplorationForm'

export default async function NewExplorationPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const projects = await listTenantProjects(tenantId, user)
  return <ExplorationForm mode="create" projects={projects} />
}
