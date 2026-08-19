import type { CollectionConfig } from 'payload'

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
import { EXPLORATION_DISCLOSURE_FIELDS } from '@/lib/publishing'

export const ExplorationContents: CollectionConfig = {
  slug: 'exploration-contents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'tenant', 'status', 'contentDate'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: EXPLORATION_DISCLOSURE_FIELDS,
        requireSource: true,
        relationChecks: [
          { field: 'project', collection: 'projects', label: 'Project', required: true },
          { field: 'sourceDocument', collection: 'documents', label: 'Source document' },
        ],
      }),
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
    },
    { name: 'title', type: 'text', required: true },
    { name: 'contentDate', type: 'date', required: true },
    { name: 'summary', type: 'textarea', required: true },
    {
      name: 'technicalDetails',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Material technical claims require a source reference and Review before Published.',
      },
    },
    sourceUrlField,
    sourceDocumentField,
    disclosureLevelField,
    publicationStatusField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
