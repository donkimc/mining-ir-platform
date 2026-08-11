import type { Field } from 'payload'

import { PUBLICATION_STATUSES } from '@/lib/constants'

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
