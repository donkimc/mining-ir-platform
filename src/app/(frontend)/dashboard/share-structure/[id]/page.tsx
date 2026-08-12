import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

import { ShareStructureForm } from '../ShareStructureForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditShareStructurePage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let record
  try {
    record = await payload.findByID({
      collection: 'share-structures',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(record.tenant)) !== String(tenantId)) {
    notFound()
  }

  return <ShareStructureForm mode="edit" recordId={String(record.id)} initial={record} />
}
