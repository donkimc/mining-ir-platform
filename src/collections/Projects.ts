import type { CollectionConfig } from 'payload'

import { preventTenantFieldChange } from '@/access'
import {
  createPublishableBeforeChange,
  publishedOnlyOrTenantScopedRead,
  stripReviewMetadataAfterRead,
} from '@/lib/collection-hooks'
import { publicationStatusField, reviewFields } from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'
import { PROJECT_DISCLOSURE_FIELDS } from '@/lib/publishing'
import { PROJECT_STAGES } from '@/lib/constants'
import { validateHttpUrl } from '@/lib/validate-url'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'tenant', 'status', 'isFlagship', 'stage'],
  },
  access: publishedOnlyOrTenantScopedRead(),
  hooks: {
    beforeChange: [
      createPublishableBeforeChange({
        disclosureFields: PROJECT_DISCLOSURE_FIELDS,
        requireSource: false,
      }),
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      index: true,
      access: {
        update: preventTenantFieldChange,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
    },
    publicationStatusField,
    {
      name: 'isFlagship',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'commodity', type: 'text' },
    { name: 'jurisdiction', type: 'text' },
    { name: 'locationSummary', type: 'textarea' },
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'ownershipPercent', type: 'number', min: 0, max: 100 },
    {
      name: 'stage',
      type: 'select',
      options: PROJECT_STAGES.map((value) => ({
        label: value
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        value,
      })),
    },
    { name: 'summary', type: 'textarea' },
    {
      name: 'highlights',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'technicalSummary',
      type: 'textarea',
      admin: {
        description: 'Material technical claims require Review before Published.',
      },
    },
    {
      name: 'sourceLinks',
      type: 'array',
      labels: {
        singular: 'Source Link',
        plural: 'Source Links',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value: unknown) => validateHttpUrl(value),
        },
      ],
      admin: {
        description: 'Source links for material technical claims.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    ...reviewFields,
    ...provenanceFields,
  ],
}
