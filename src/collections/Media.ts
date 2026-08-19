import { randomUUID } from 'crypto'
import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import {
  isPlatformAdmin,
  preventTenantFieldChange,
  tenantScopedCompanyAdminWrite,
  tenantScopedRead,
  userHasTenantAccess,
} from '@/access'
import { serializeAnonymousPublicDoc } from '@/lib/collection-hooks'

function relationId(value: unknown): string | number | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: string | number }).id
  }
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

function payloadMediaFileUrl(filename: string): string {
  return `/api/media/file/${encodeURIComponent(filename)}`
}

/** Page size for anonymous media reference collection (S4-3). No hard total cap. */
export const MEDIA_REFERENCE_PAGE_SIZE = 100

/**
 * Anonymous visitors may only read media referenced by published Documents/People
 * for the **resolved** published tenant (N4: do not materialize IDs across all tenants).
 *
 * S4-3: paginate reference queries — do not silently cap at 1000.
 */
export async function publishedReferencedMediaWhere(
  req: PayloadRequest,
  options?: { pageSize?: number },
): Promise<Where> {
  let companyId: string | number | null = null
  try {
    const { getPublishedCompanyBySlug, resolveTenantSlug } = await import('@/lib/tenant')
    const slug = await resolveTenantSlug()
    const company = await getPublishedCompanyBySlug(slug)
    companyId = company?.id ?? null
  } catch {
    return { id: { in: [] } }
  }

  if (companyId == null) {
    return { id: { in: [] } }
  }

  const mediaIds = new Set<string>()
  const pageSize = options?.pageSize ?? MEDIA_REFERENCE_PAGE_SIZE

  async function collectReferencedIds(
    collection: 'documents' | 'people',
    fileField: 'file' | 'headshot',
  ) {
    let page = 1
    for (;;) {
      const result = await req.payload.find({
        collection,
        where: {
          and: [
            { status: { equals: 'published' } },
            { tenant: { equals: companyId } },
            { [fileField]: { exists: true } },
          ],
        },
        limit: pageSize,
        page,
        depth: 0,
        overrideAccess: true,
      })

      for (const doc of result.docs) {
        const fileId = relationId((doc as unknown as Record<string, unknown>)[fileField])
        if (fileId != null) mediaIds.add(String(fileId))
      }

      if (!result.hasNextPage) break
      page += 1
    }
  }

  await Promise.all([collectReferencedIds('documents', 'file'), collectReferencedIds('people', 'headshot')])

  return {
    id: {
      in: [...mediaIds],
    },
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'originalFilename', 'tenant', 'updatedAt'],
  },
  access: {
    create: async ({ req, data }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      const tenantId = relationId(data?.tenant)
      if (!tenantId) return false
      return userHasTenantAccess(req, tenantId, ['company_admin'])
    },
    delete: tenantScopedCompanyAdminWrite,
    read: async ({ req }) => {
      if (req.user) {
        if (isPlatformAdmin(req.user)) return true
        return tenantScopedRead({ req })
      }

      return publishedReferencedMediaWhere(req)
    },
    update: tenantScopedCompanyAdminWrite,
  },
  hooks: {
    beforeOperation: [
      ({ operation, req, args }) => {
        // S4-2: never expand tenant for anonymous media list/detail reads.
        if (!req.user && (operation === 'read' || operation === 'find' || operation === 'findByID')) {
          if (args && typeof args === 'object') {
            ;(args as { depth?: number }).depth = 0
          }
        }

        if ((operation !== 'create' && operation !== 'update') || !req.file?.name) return
        const originalName = req.file.name
        req.context = {
          ...req.context,
          originalFilename: originalName,
        }
        const safeName = originalName.replace(/[/\\]/g, '_')
        req.file.name = `${randomUUID()}-${safeName}`
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        if (req.user && !isPlatformAdmin(req.user) && operation === 'update' && originalDoc?.tenant) {
          data.tenant = relationId(originalDoc.tenant) ?? originalDoc.tenant
        }
        const originalFilename = req.context?.originalFilename
        if (typeof originalFilename === 'string' && originalFilename.length > 0) {
          data.originalFilename = originalFilename
          if (!data.alt) data.alt = originalFilename
        }
        return data
      },
    ],
    afterRead: [
      ({ doc, req, context }) => {
        if (!doc) return doc
        if (doc.filename && typeof doc.filename === 'string') {
          doc.url = payloadMediaFileUrl(doc.filename)
        }
        if (doc.url && typeof doc.url === 'string') {
          if (
            doc.url.includes('storage.supabase.co') ||
            doc.url.includes('/storage/v1/object/public/')
          ) {
            doc.url = doc.filename ? payloadMediaFileUrl(String(doc.filename)) : null
          }
        }
        // S4-2 / L-1: anonymous callers must not receive tenant (or expanded company) fields.
        // Internal relation checks set context.skipPublicSerializer to retain tenant IDs.
        if (!req.user && !context?.skipPublicSerializer) {
          return serializeAnonymousPublicDoc(doc as Record<string, unknown>)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      index: true,
      access: {
        update: preventTenantFieldChange,
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'originalFilename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Original upload name retained for display; stored object key is UUID-prefixed.',
      },
    },
  ],
  upload: true,
}
