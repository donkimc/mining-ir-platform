import type { CollectionConfig } from 'payload'

import {
  createPublishableBeforeChange,
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import {
  publicationStatusField,
  reviewFields,
  sourceDocumentField,
  sourceUrlField,
} from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'
import { SHARE_DISCLOSURE_FIELDS } from '@/lib/publishing'

export const ShareStructures: CollectionConfig = {
  slug: 'share-structures',
  admin: {
    useAsTitle: 'asOfDate',
    defaultColumns: ['asOfDate', 'tenant', 'sharesOutstanding', 'status'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: SHARE_DISCLOSURE_FIELDS,
        requireSource: true,
        relationChecks: [
          { field: 'sourceDocument', collection: 'documents', label: 'Source document' },
        ],
      }),
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    { name: 'asOfDate', type: 'date', required: true },
    { name: 'sharesOutstanding', type: 'number' },
    { name: 'options', type: 'number' },
    { name: 'warrants', type: 'number' },
    { name: 'fullyDiluted', type: 'number' },
    { name: 'marketCapNote', type: 'textarea' },
    sourceUrlField,
    sourceDocumentField,
    publicationStatusField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
