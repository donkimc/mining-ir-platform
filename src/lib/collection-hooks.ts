import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'

import {
  isPlatformAdmin,
  preventTenantFieldChange,
  tenantScopedCompanyAdminWrite,
  tenantScopedRead,
  userHasTenantAccess,
} from '@/access'
import {
  applyReviewMetadata,
  assertDisclosureWriteAllowed,
  assertPublicationTransition,
  assertSameTenantRelation,
  assertSourceReferenceRequired,
  guardCreateNotPublished,
  relationId,
  shouldRequireSource,
  stripForgedReviewMetadata,
} from '@/lib/publishing'

type RelationCheck = {
  field: string
  collection: 'projects' | 'documents' | 'media'
  label: string
  required?: boolean
}

export function tenantField(): CollectionConfig['fields'][number] {
  return {
    name: 'tenant',
    type: 'relationship',
    relationTo: 'companies',
    required: true,
    index: true,
    access: {
      update: preventTenantFieldChange,
    },
  }
}

export function publishedOnlyOrTenantScopedRead(): CollectionConfig['access'] {
  return {
    create: async ({ req, data }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      const tenantId = relationId(data?.tenant)
      if (!tenantId) return false
      return userHasTenantAccess(req, tenantId, ['company_admin'])
    },
    delete: tenantScopedCompanyAdminWrite,
    read: async ({ req }) => {
      if (!req.user) {
        // Lazy import avoids loading Payload config when collections are imported for static checks.
        const { getPublishedCompanyBySlug, resolveTenantSlug } = await import('@/lib/tenant')
        const slug = await resolveTenantSlug()
        const company = await getPublishedCompanyBySlug(slug)
        if (!company) {
          return {
            id: { in: [] },
          }
        }
        return {
          and: [
            { status: { equals: 'published' } },
            { tenant: { equals: company.id } },
          ],
        }
      }
      return tenantScopedRead({ req })
    },
    update: tenantScopedCompanyAdminWrite,
  }
}

/**
 * Public API serializer for anonymous reads.
 * Keeps intentional Published fields; strips reviewer identity, review timestamps,
 * and other internal audit fields. Authenticated dashboard/admin callers keep full docs.
 */
export const stripReviewMetadataAfterRead: CollectionAfterReadHook = ({ doc, req }) => {
  if (!doc || req.user) return doc
  return serializeAnonymousPublicDoc(doc as Record<string, unknown>)
}

/** Alias for clarity in Sprint 3 docs/tests. */
export const publicApiSerializerAfterRead = stripReviewMetadataAfterRead

const ANON_STRIP_KEYS = [
  'reviewedBy',
  'reviewedAt',
  'publishedAt',
] as const

export function serializeAnonymousPublicDoc<T extends Record<string, unknown>>(doc: T): T {
  const next = { ...doc }
  for (const key of ANON_STRIP_KEYS) {
    delete next[key]
  }
  return next
}

export function createPublishableBeforeChange(args: {
  disclosureFields: readonly string[]
  requireSource?: boolean
  relationChecks?: RelationCheck[]
}): CollectionBeforeChangeHook {
  const { disclosureFields, requireSource = false, relationChecks = [] } = args

  return async ({ data, originalDoc, req, operation }) => {
    if (!data) return data

    const next = stripForgedReviewMetadata(data as Record<string, unknown>)

    if (req.user && !isPlatformAdmin(req.user)) {
      const tenantId = relationId(next.tenant ?? originalDoc?.tenant)
      if (tenantId) {
        const allowed = await userHasTenantAccess(req, tenantId, ['company_admin'])
        if (!allowed) {
          throw new Error('Forbidden')
        }
      }

      if (operation === 'update' && originalDoc?.tenant != null) {
        next.tenant = relationId(originalDoc.tenant) ?? originalDoc.tenant
      }
    }

    const tenantId = relationId(next.tenant ?? originalDoc?.tenant)
    if (tenantId && req.payload) {
      for (const check of relationChecks) {
        const relatedId = relationId(next[check.field] ?? originalDoc?.[check.field as keyof typeof originalDoc])
        if (check.required && relatedId == null && operation === 'create') {
          continue
        }
        if (Object.prototype.hasOwnProperty.call(next, check.field) || relatedId != null) {
          const incoming = Object.prototype.hasOwnProperty.call(next, check.field)
            ? relationId(next[check.field])
            : relatedId
          await assertSameTenantRelation({
            payload: req.payload,
            tenantId,
            collection: check.collection,
            id: incoming,
            label: check.label,
          })
        }
      }
    }

    const previousStatus = (originalDoc?.status as string | undefined) ?? null
    const incomingStatus = (next.status as string | undefined) ?? previousStatus

    if (operation === 'create') {
      guardCreateNotPublished(incomingStatus)
    }

    assertSourceReferenceRequired({
      data: next,
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      incomingStatus,
      required: shouldRequireSource({
        collectionDefault: requireSource,
        data: next,
        originalDoc: originalDoc as Record<string, unknown> | undefined,
      }),
    })

    assertPublicationTransition({ incomingStatus, previousStatus })
    assertDisclosureWriteAllowed({
      fields: disclosureFields,
      data: next,
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      previousStatus,
      incomingStatus,
    })

    return applyReviewMetadata({
      data: next,
      incomingStatus,
      previousStatus,
      reviewerId: req.user?.id,
    })
  }
}

export async function requireTenantAdmin(
  req: PayloadRequest,
  tenantId: string | number | null,
): Promise<void> {
  if (!req.user) throw new Error('Forbidden')
  if (isPlatformAdmin(req.user)) return
  if (!tenantId) throw new Error('Forbidden')
  const allowed = await userHasTenantAccess(req, tenantId, ['company_admin'])
  if (!allowed) throw new Error('Forbidden')
}
