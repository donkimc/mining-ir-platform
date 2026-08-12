import type { CollectionConfig } from 'payload'

import {
  isPlatformAdmin,
  preventTenantFieldChange,
  tenantScopedCompanyAdminWrite,
  tenantScopedRead,
  userHasTenantAccess,
} from '@/access'
import { publicationStatusField, reviewFields } from '@/lib/fields'
import {
  applyReviewMetadata,
  assertDisclosureWriteAllowed,
  assertPublicationTransition,
  guardCreateNotPublished,
  PROJECT_DISCLOSURE_FIELDS,
  relationId,
  stripForgedReviewMetadata,
} from '@/lib/publishing'
import { PROJECT_STAGES } from '@/lib/constants'
import { validateHttpUrl } from '@/lib/validate-url'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'tenant', 'status', 'isFlagship', 'stage'],
  },
  access: {
    create: async ({ req, data }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      const tenantId = relationId(data?.tenant)
      if (!tenantId) return false
      return userHasTenantAccess(req, tenantId, ['company_admin'])
    },
    delete: tenantScopedCompanyAdminWrite,
    read: async ({ req }) => {
      if (!req.user) {
        return {
          status: {
            equals: 'published',
          },
        }
      }
      return tenantScopedRead({ req })
    },
    update: tenantScopedCompanyAdminWrite,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data

        const next = stripForgedReviewMetadata(data as Record<string, unknown>)

        if (req.user && !isPlatformAdmin(req.user)) {
          const tenantId = relationId(next.tenant ?? originalDoc?.tenant)
          if (tenantId) {
            const allowed = await userHasTenantAccess(req, tenantId, ['company_admin'])
            if (!allowed) {
              throw new Error('Forbidden')
            }
          }

          // Preserve ownership; Company Admins cannot reassign tenant.
          if (operation === 'update' && originalDoc?.tenant != null) {
            next.tenant = relationId(originalDoc.tenant) ?? originalDoc.tenant
          }
        }

        const previousStatus = originalDoc?.status ?? null
        const incomingStatus = (next.status as string | undefined) ?? previousStatus

        if (operation === 'create') {
          guardCreateNotPublished(incomingStatus)
        }

        assertPublicationTransition({ incomingStatus, previousStatus })
        assertDisclosureWriteAllowed({
          fields: PROJECT_DISCLOSURE_FIELDS,
          data: next,
          originalDoc: originalDoc as Record<string, unknown> | undefined,
          previousStatus,
          incomingStatus,
        })

        return applyReviewMetadata({
          data: next,
          incomingStatus,
          previousStatus,
          reviewerId: req.user?.id,
        })
      },
    ],
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
  ],
}
