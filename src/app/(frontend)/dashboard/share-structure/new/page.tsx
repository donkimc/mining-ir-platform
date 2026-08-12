import { requireCompanyAdmin } from '@/lib/auth'

import { ShareStructureForm } from '../ShareStructureForm'

export default async function NewShareStructurePage() {
  await requireCompanyAdmin()
  return <ShareStructureForm mode="create" />
}
