import type { Field } from 'payload'

/** Server-controlled origin / provenance (ADR-0012). Not Company-Admin writable. */
export const PROVENANCE_FIELD_NAMES = [
  'contentOrigin',
  'originLockedAt',
  'sourceLocation',
  'provenanceClaims',
  'extractionRunId',
  'extractionProvider',
  'extractionModel',
  'extractionModelVersion',
  'extractedAt',
  'reviewerSourceCheckBy',
  'reviewerSourceCheckAt',
] as const

export type ProvenanceFieldName = (typeof PROVENANCE_FIELD_NAMES)[number]

export const provenanceFields: Field[] = [
  {
    name: 'contentOrigin',
    type: 'select',
    required: false,
    defaultValue: 'human_authored',
    options: [
      { label: 'Human authored', value: 'human_authored' },
      { label: 'Machine assisted', value: 'machine_assisted' },
    ],
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Server-controlled. Company Admins cannot change origin. Defaults to human_authored.',
    },
  },
  {
    name: 'originLockedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
  {
    name: 'sourceLocation',
    type: 'json',
    admin: {
      readOnly: true,
      description: 'Page/section/region locator for machine-assisted claims (not public).',
    },
  },
  {
    name: 'provenanceClaims',
    type: 'json',
    admin: {
      readOnly: true,
      description: 'Claim-to-source references for reviewers (not public).',
    },
  },
  {
    name: 'extractionRunId',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'extractionProvider',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'extractionModel',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'extractionModelVersion',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'extractedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
  {
    name: 'reviewerSourceCheckBy',
    type: 'relationship',
    relationTo: 'users',
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Set when a reviewer acknowledges source context on approval.',
    },
  },
  {
    name: 'reviewerSourceCheckAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
]
