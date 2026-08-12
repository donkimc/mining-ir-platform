import { randomUUID } from 'crypto'
import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import {
  isPlatformAdmin,
  preventTenantFieldChange,
  tenantScopedCompanyAdminWrite,
  tenantScopedRead,
  userHasTenantAccess,
} from '@/access'

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

/**
 * Anonymous visitors may only read media referenced by published Documents/People
 * belonging to a published, active tenant. Tenant publication alone is not enough.
 */
export async function publishedReferencedMediaWhere(req: PayloadRequest): Promise<Where> {
  const publishedTenants = await req.payload.find({
    collection: 'companies',
    where: {
      and: [
        { status: { equals: 'active' } },
        { publicationStatus: { equals: 'published' } },
      ],
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const tenantIds = publishedTenants.docs.map((doc) => doc.id)
  if (tenantIds.length === 0) {
    return { id: { in: [] } }
  }

  const [documents, people] = await Promise.all([
    req.payload.find({
      collection: 'documents',
      where: {
        and: [
          { status: { equals: 'published' } },
          { tenant: { in: tenantIds } },
          { file: { exists: true } },
        ],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: 'people',
      where: {
        and: [
          { status: { equals: 'published' } },
          { tenant: { in: tenantIds } },
          { headshot: { exists: true } },
        ],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const mediaIds = new Set<string>()

  for (const doc of documents.docs) {
    const fileId = relationId(doc.file)
    if (fileId != null) mediaIds.add(String(fileId))
  }

  for (const person of people.docs) {
    const headshotId = relationId(person.headshot)
    if (headshotId != null) mediaIds.add(String(headshotId))
  }

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
      ({ operation, req }) => {
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
      ({ doc }) => {
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
