import type { CollectionConfig } from 'payload'

import {
  createPublishableBeforeChange,
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import {
  disclosureLevelField,
  documentCategoryField,
  publicationStatusField,
  reviewFields,
  sourceDocumentField,
  sourceUrlField,
} from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'
import { DOCUMENT_DISCLOSURE_FIELDS } from '@/lib/publishing'
import { validateHttpUrl } from '@/lib/validate-url'

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'tenant', 'status', 'publicationDate'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: DOCUMENT_DISCLOSURE_FIELDS,
        requireSource: true,
        relationChecks: [
          { field: 'project', collection: 'projects', label: 'Related project' },
          { field: 'file', collection: 'media', label: 'Uploaded file' },
          { field: 'sourceDocument', collection: 'documents', label: 'Source document' },
        ],
      }),
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    documentCategoryField,
    { name: 'publicationDate', type: 'date', required: true },
    {
      name: 'externalUrl',
      type: 'text',
      validate: (value: unknown) => validateHttpUrl(value),
      admin: {
        description: 'External presentation or document URL.',
      },
    },
    {
      name: 'file',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
    },
    sourceUrlField,
    sourceDocumentField,
    disclosureLevelField,
    publicationStatusField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
