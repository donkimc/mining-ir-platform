import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

import { PersonForm } from '../PersonForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let person
  try {
    person = await payload.findByID({
      collection: 'people',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(person.tenant)) !== String(tenantId)) {
    notFound()
  }

  return <PersonForm mode="edit" personId={String(person.id)} initial={person} />
}
