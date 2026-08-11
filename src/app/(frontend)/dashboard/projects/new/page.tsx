import { requireCompanyAdmin } from '@/lib/auth'

import { ProjectForm } from '../ProjectForm'

export default async function NewProjectPage() {
  await requireCompanyAdmin()
  return <ProjectForm mode="create" />
}
