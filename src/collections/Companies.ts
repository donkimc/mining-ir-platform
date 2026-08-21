import type { CollectionConfig } from 'payload'

import {
  companiesReadAccess,
  companiesWriteAccess,
  isPlatformAdmin,
  platformAdminOnly,
} from '@/access'
import { reviewFields } from '@/lib/fields'
import { provenanceFields } from '@/lib/provenance-fields'
import { stripReviewMetadataAfterRead } from '@/lib/collection-hooks'
import {
  applyReviewMetadata,
  assertDisclosureWriteAllowed,
  assertPublicationTransition,
  COMPANY_DISCLOSURE_FIELDS,
  guardCreateNotPublished,
} from '@/lib/publishing'
import { PUBLICATION_STATUSES, TENANT_STATUSES } from '@/lib/constants'
import { validateHttpUrl } from '@/lib/validate-url'

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'slug', 'status', 'publicationStatus', 'tickerSymbol'],
  },
  access: {
    create: platformAdminOnly,
    delete: platformAdminOnly,
    read: companiesReadAccess,
    update: companiesWriteAccess,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        if (!data) return data

        if (!isPlatformAdmin(req.user) && operation === 'update' && originalDoc) {
          // Company Admins cannot change platform-managed identity fields.
          data.slug = originalDoc.slug
          data.status = originalDoc.status
          data.templateKey = originalDoc.templateKey
          data.subdomain = originalDoc.subdomain
          data.websiteDomain = originalDoc.websiteDomain
        }

        const previousStatus = originalDoc?.publicationStatus ?? null
        const incomingStatus = data.publicationStatus ?? previousStatus

        if (operation === 'create') {
          guardCreateNotPublished(incomingStatus)
        }

        assertPublicationTransition({ incomingStatus, previousStatus })
        assertDisclosureWriteAllowed({
          fields: COMPANY_DISCLOSURE_FIELDS,
          data: data as Record<string, unknown>,
          originalDoc: originalDoc as Record<string, unknown> | undefined,
          previousStatus,
          incomingStatus,
        })

        return applyReviewMetadata({
          data,
          incomingStatus,
          previousStatus,
          reviewerId: req.user?.id,
        })
      },
    ],
    afterRead: [stripReviewMetadataAfterRead],
  },
  fields: [
    {
      name: 'legalName',
      type: 'text',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable public tenant slug. Used for local tenant resolution.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: TENANT_STATUSES.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
      access: {
        update: ({ req }) => isPlatformAdmin(req.user),
      },
    },
    {
      name: 'publicationStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: PUBLICATION_STATUSES.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
      admin: {
        description: 'Public website shows company profile only when Published.',
      },
    },
    {
      name: 'templateKey',
      type: 'select',
      required: true,
      defaultValue: 'explorer',
      options: [
        { label: 'Explorer', value: 'explorer' },
        { label: 'Summit', value: 'summit' },
      ],
      access: {
        update: ({ req }) => isPlatformAdmin(req.user),
      },
    },
    { name: 'primaryCommodity', type: 'text' },
    { name: 'jurisdiction', type: 'text' },
    { name: 'tickerSymbol', type: 'text' },
    { name: 'exchange', type: 'text' },
    {
      name: 'websiteDomain',
      type: 'text',
      access: {
        update: ({ req }) => isPlatformAdmin(req.user),
      },
    },
    {
      name: 'subdomain',
      type: 'text',
      unique: true,
      index: true,
      access: {
        update: ({ req }) => isPlatformAdmin(req.user),
      },
      admin: {
        description: 'Exact tenant label for <subdomain>.nrlaunch.com. Platform Admin only.',
      },
    },
    {
      name: 'brandColors',
      type: 'group',
      fields: [
        { name: 'primary', type: 'text' },
        { name: 'secondary', type: 'text' },
        { name: 'accent', type: 'text' },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
    },
    { name: 'longDescription', type: 'textarea' },
    { name: 'investmentThesis', type: 'textarea' },
    { name: 'irContactName', type: 'text' },
    { name: 'irContactEmail', type: 'email' },
    { name: 'irContactPhone', type: 'text' },
    { name: 'officeAddress', type: 'textarea' },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value: unknown) => validateHttpUrl(value),
        },
      ],
    },
    ...reviewFields,
    ...provenanceFields,
  ],
}
