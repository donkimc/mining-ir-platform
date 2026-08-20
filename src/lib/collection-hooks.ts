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
  applySourceCheckMetadata,
  assertDisclosureWriteAllowed,
  assertMachineAssistedSourceCheck,
  assertNoClientProvenanceMutation,
  assertPublicationTransition,
  assertSameTenantRelation,
  assertSourceReferenceRequired,
  guardCreateNotMachinePublished,
  guardCreateNotPublished,
  relationId,
  restoreProvenanceFromOriginal,
  shouldRequireSource,
  stripForgedProvenanceMetadata,
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
 * tenant relation IDs and platform routing metadata. Authenticated callers keep full docs.
 * Internal relation checks can set `context.skipPublicSerializer` to retain tenant IDs.
 */
export const stripReviewMetadataAfterRead: CollectionAfterReadHook = ({ doc, req, context }) => {
  if (!doc || req.user || context?.skipPublicSerializer) return doc
  return serializeAnonymousPublicDoc(doc as Record<string, unknown>)
}

/** Alias for clarity in Sprint 3/4 docs/tests. */
export const publicApiSerializerAfterRead = stripReviewMetadataAfterRead

const ANON_STRIP_KEYS = [
  'reviewedBy',
  'reviewedAt',
  'publishedAt',
  // L-1: tenant relation IDs are not part of the public API contract.
  'tenant',
  // M-1: platform routing / template internals are not investor content.
  'websiteDomain',
  'subdomain',
  'templateKey',
  // ADR-0012: provenance / extraction / source-check never anonymous.
  'contentOrigin',
  'originLockedAt',
  'sourceLocation',
  'provenanceClaims',
  'extractionRunId',
  'extractionProvider',
  'extractionModel',
  'extractionModelVersion',
  'extractedAt',
  'reviewerSourceCheckBy',
  'reviewerSourceCheckAt',
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

    const sourceCheckAcknowledged = Boolean(
      req.context && (req.context as { sourceCheckAcknowledged?: boolean }).sourceCheckAcknowledged,
    )

    const serverProvenance =
      req.context && (req.context as { serverProvenance?: Record<string, unknown> }).serverProvenance

    // S5-3: explicit error when clients attempt provenance writes on update; strip/restore remain.
    assertNoClientProvenanceMutation({
      data: data as Record<string, unknown>,
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      operation,
      allowServerProvenance: Boolean(serverProvenance),
    })

    let next = stripForgedReviewMetadata(data as Record<string, unknown>)
    next = stripForgedProvenanceMetadata(next)

    next = restoreProvenanceFromOriginal({
      data: next,
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      serverProvenance: serverProvenance as Parameters<
        typeof restoreProvenanceFromOriginal
      >[0]['serverProvenance'],
    })
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
      guardCreateNotMachinePublished({
        status: incomingStatus,
        contentOrigin: next.contentOrigin as string | undefined,
      })
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

    assertMachineAssistedSourceCheck({
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      incomingStatus,
      previousStatus,
      sourceCheckAcknowledged,
    })

    next = applySourceCheckMetadata({
      data: next,
      incomingStatus,
      previousStatus,
      reviewerId: req.user?.id,
      originalDoc: originalDoc as Record<string, unknown> | undefined,
      sourceCheckAcknowledged,
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
