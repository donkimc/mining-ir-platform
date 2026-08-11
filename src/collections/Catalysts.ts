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

export const Catalysts: CollectionConfig = {
  slug: 'catalysts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'status', 'expectedTiming'],
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
    { name: 'title', type: 'text', required: true },
    { name: 'expectedTiming', type: 'text' },
    { name: 'summary', type: 'textarea' },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
    publicationStatusField,
  ],
}
