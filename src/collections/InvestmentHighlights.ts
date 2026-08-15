import type { CollectionConfig } from 'payload'

import { isPlatformAdmin } from '@/access'
import {
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import { publicationStatusField } from '@/lib/fields'

export const InvestmentHighlights: CollectionConfig = {
  slug: 'investment-highlights',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'status', 'displayOrder'],
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
    { name: 'summary', type: 'textarea', required: true },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
    publicationStatusField,
  ],
}
