import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  createPublishableBeforeChange,
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import {
  disclosureLevelField,
  publicationStatusField,
  reviewFields,
  sourceDocumentField,
  sourceUrlField,
} from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'

const LISTING_DISCLOSURE_FIELDS = ['symbol', 'exchange', 'market', 'listingType', 'quoteCurrency'] as const

export const CompanyListings: CollectionConfig = {
  slug: 'company-listings',
  admin: {
    useAsTitle: 'symbol',
    defaultColumns: ['symbol', 'exchange', 'isPrimary', 'tenant', 'status', 'displayOrder'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: LISTING_DISCLOSURE_FIELDS,
        requireSource: true,
        relationChecks: [
          { field: 'sourceDocument', collection: 'documents', label: 'Source document' },
        ],
      }),
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        if (typeof data.symbol === 'string') {
          data.symbol = data.symbol.trim().toUpperCase()
        }

        const tenantId =
          (typeof data.tenant === 'object' && data.tenant && 'id' in data.tenant
            ? (data.tenant as { id: number | string }).id
            : data.tenant) ??
          (typeof originalDoc?.tenant === 'object' && originalDoc.tenant && 'id' in originalDoc.tenant
            ? (originalDoc.tenant as { id: number | string }).id
            : originalDoc?.tenant)

        if (data.isPrimary && tenantId != null && req.payload) {
          const others = await req.payload.find({
            collection: 'company-listings',
            where: {
              and: [
                { tenant: { equals: tenantId } },
                { isPrimary: { equals: true } },
                ...(operation === 'update' && originalDoc?.id
                  ? [{ id: { not_equals: originalDoc.id } }]
                  : []),
              ],
            },
            limit: 1,
            overrideAccess: true,
          })
          if (others.docs.length > 0) {
            throw new APIError('Only one primary listing is allowed per tenant.', 400)
          }
        }

        return data
      },
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    {
      name: 'symbol',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'exchange',
      type: 'text',
      required: true,
      index: true,
    },
    { name: 'market', type: 'text' },
    {
      name: 'listingType',
      type: 'select',
      options: [
        { label: 'Equity', value: 'equity' },
        { label: 'OTC', value: 'otc' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'quoteCurrency', type: 'text' },
    {
      name: 'isPrimary',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    publicationStatusField,
    disclosureLevelField,
    sourceUrlField,
    sourceDocumentField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
