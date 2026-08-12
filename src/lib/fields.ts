import type { Field } from 'payload'

import { DISCLOSURE_LEVELS, DOCUMENT_CATEGORIES, PUBLICATION_STATUSES } from '@/lib/constants'
import { validateHttpUrl } from '@/lib/validate-url'

export const publicationStatusField: Field = {
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  options: PUBLICATION_STATUSES.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    value,
  })),
  admin: {
    position: 'sidebar',
    description: 'Public pages render Published records only.',
  },
}

export const reviewFields: Field[] = [
  {
    name: 'reviewedBy',
    type: 'relationship',
    relationTo: 'users',
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Set automatically when a Review record is approved to Published.',
    },
  },
  {
    name: 'reviewedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      date: {
        pickerAppearance: 'dayAndTime',
      },
    },
  },
  {
    name: 'publishedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      date: {
        pickerAppearance: 'dayAndTime',
      },
    },
  },
]

export const disclosureLevelField: Field = {
  name: 'disclosureLevel',
  type: 'select',
  required: true,
  defaultValue: 'standard',
  options: DISCLOSURE_LEVELS.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    value,
  })),
  admin: {
    position: 'sidebar',
  },
}

export const sourceUrlField: Field = {
  name: 'sourceUrl',
  type: 'text',
  validate: (value: unknown) => validateHttpUrl(value),
  admin: {
    description: 'http(s) source for material claims when no source document is linked.',
  },
}

export const sourceDocumentField: Field = {
  name: 'sourceDocument',
  type: 'relationship',
  relationTo: 'documents',
  admin: {
    description: 'Optional tenant document used as the source reference.',
  },
}

export const documentCategoryField: Field = {
  name: 'category',
  type: 'select',
  required: true,
  defaultValue: 'other',
  options: DOCUMENT_CATEGORIES.map((value) => ({
    label: value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    value,
  })),
}
