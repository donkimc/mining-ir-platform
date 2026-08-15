import type { CollectionConfig } from 'payload'

import { isPlatformAdmin } from '@/access'
import {
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import { publicationStatusField } from '@/lib/fields'

export const Catalysts: CollectionConfig = {
  slug: 'catalysts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'status', 'expectedTiming'],
  },
  access: publishedOnlyOrTenantScopedRead(),
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
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    { name: 'title', type: 'text', required: true },
    { name: 'expectedTiming', type: 'text' },
    { name: 'summary', type: 'textarea' },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
    publicationStatusField,
  ],
}
