import { requireCompanyAdmin } from '@/lib/auth'

import { PersonForm } from '../PersonForm'

export default async function NewPersonPage() {
  await requireCompanyAdmin()
  return <PersonForm mode="create" />
}
