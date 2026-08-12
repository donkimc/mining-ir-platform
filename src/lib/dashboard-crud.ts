import { getPayloadClient } from '@/lib/auth'
import { relationId } from '@/lib/publishing'
import type { CollectionSlug } from 'payload'

export async function assertOwnedRecord(
  collection: CollectionSlug,
  id: string,
  tenantId: string | number,
  user: unknown,
) {
  const payload = await getPayloadClient()
  try {
    const existing = await payload.findByID({
      collection,
      id,
      depth: 0,
      user: user as never,
      overrideAccess: false,
    })
    const existingTenant = relationId((existing as { tenant?: unknown }).tenant)
    if (String(existingTenant) !== String(tenantId)) {
      return { error: 'Forbidden.' as const }
    }
    return { existing }
  } catch {
    return { error: 'Forbidden.' as const }
  }
}

export async function listTenantProjects(tenantId: string | number, user: unknown) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: { tenant: { equals: tenantId } },
    sort: 'name',
    limit: 100,
    depth: 0,
    user: user as never,
    overrideAccess: false,
  })
  return result.docs as Array<{ id: string | number; name: string }>
}
