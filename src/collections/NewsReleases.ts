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
import { NEWS_DISCLOSURE_FIELDS } from '@/lib/publishing'

export const NewsReleases: CollectionConfig = {
  slug: 'news-releases',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'tenant', 'status', 'releaseDate'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: NEWS_DISCLOSURE_FIELDS,
        requireSource: true,
        relationChecks: [
          { field: 'project', collection: 'projects', label: 'Related project' },
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
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
    },
    { name: 'releaseDate', type: 'date', required: true },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'body', type: 'textarea', required: true },
    sourceUrlField,
    sourceDocumentField,
    disclosureLevelField,
    publicationStatusField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
