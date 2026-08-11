import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isPlatformAdmin, platformAdminOnly } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'platformRole', 'status'],
  },
  auth: true,
  access: {
    admin: ({ req }) => isPlatformAdmin(req.user),
    create: platformAdminOnly,
    delete: platformAdminOnly,
    read: ({ req }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
  },
  hooks: {
    beforeLogin: [
      async ({ user }) => {
        if (!user || user.status !== 'active') {
          throw new APIError('This account is disabled or inactive.', 403)
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'platformRole',
      type: 'select',
      options: [
        {
          label: 'Platform Admin',
          value: 'platform_admin',
        },
      ],
      admin: {
        description: 'Cross-tenant platform role. Leave empty for tenant-only users.',
      },
      access: {
        update: ({ req }) => isPlatformAdmin(req.user),
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Disabled', value: 'disabled' },
      ],
    },
  ],
}
