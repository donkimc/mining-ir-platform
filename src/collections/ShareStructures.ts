import type { CollectionConfig } from 'payload'

import {
  isPlatformAdmin,
  tenantScopedCompanyAdminWrite,
  tenantScopedRead,
  userHasTenantAccess,
} from '@/access'
import { publicationStatusField } from '@/lib/fields'

function relationId(value: unknown): string | number | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: string | number }).id
  }
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

export const ShareStructures: CollectionConfig = {
  slug: 'share-structures',
  admin: {
    useAsTitle: 'asOfDate',
    defaultColumns: ['asOfDate', 'tenant', 'sharesOutstanding', 'status'],
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
      if (!req.user) return { status: { equals: 'published' } }
      return tenantScopedRead({ req })
    },
    update: tenantScopedCompanyAdminWrite,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (!data) return data
        if (!isPlatformAdmin(req.user) && operation === 'update') {
          delete data.tenant
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
    { name: 'asOfDate', type: 'date', required: true },
    { name: 'sharesOutstanding', type: 'number' },
    { name: 'options', type: 'number' },
    { name: 'warrants', type: 'number' },
    { name: 'fullyDiluted', type: 'number' },
    { name: 'marketCapNote', type: 'text' },
    publicationStatusField,
  ],
}
