import type { CollectionConfig } from 'payload'

import {
  isPlatformAdmin,
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

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'tenant', 'updatedAt'],
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
      if (tenantIds.length === 0) return false

      return {
        tenant: {
          in: tenantIds,
        },
      }
    },
    update: tenantScopedCompanyAdminWrite,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        if (req.user && !isPlatformAdmin(req.user) && operation === 'update' && originalDoc?.tenant) {
          data.tenant = relationId(originalDoc.tenant) ?? originalDoc.tenant
        }
        return data
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
        update: ({ req }) => isPlatformAdmin(req.user),
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
