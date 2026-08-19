import type { CollectionConfig } from 'payload'

import {
  createPublishableBeforeChange,
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
  tenantField,
} from '@/lib/collection-hooks'
import { disclosureLevelField, publicationStatusField, reviewFields } from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'
import { PERSON_GROUPS } from '@/lib/constants'
import { PERSON_DISCLOSURE_FIELDS } from '@/lib/publishing'

export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'roleTitle', 'group', 'tenant', 'status', 'displayOrder'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: PERSON_DISCLOSURE_FIELDS,
        requireSource: false,
        relationChecks: [{ field: 'headshot', collection: 'media', label: 'Headshot' }],
      }),
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    tenantField(),
    { name: 'name', type: 'text', required: true },
    { name: 'roleTitle', type: 'text', required: true },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'management',
      options: PERSON_GROUPS.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
    },
    {
      name: 'biography',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Biography is disclosure-sensitive and review-gated when Published.',
      },
    },
    {
      name: 'headshot',
      type: 'relationship',
      relationTo: 'media',
    },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
    disclosureLevelField,
    publicationStatusField,
    ...reviewFields,
    ...provenanceFields,
  ],
}
