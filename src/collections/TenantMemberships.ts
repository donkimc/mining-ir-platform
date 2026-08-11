import type { CollectionConfig } from 'payload'

import { isPlatformAdmin, platformAdminOnly } from '@/access'
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from '@/lib/constants'

export const TenantMemberships: CollectionConfig = {
  slug: 'tenant-memberships',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'tenant', 'role', 'status'],
  },
  access: {
    create: platformAdminOnly,
    delete: platformAdminOnly,
    read: async ({ req }) => {
      if (!req.user) return false
      if (isPlatformAdmin(req.user)) return true
      return {
        user: {
          equals: req.user.id,
        },
      }
    },
    update: platformAdminOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      index: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: MEMBERSHIP_ROLES.map((value) => ({
        label: value
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        value,
      })),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: MEMBERSHIP_STATUSES.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
    },
    {
      name: 'invitedAt',
      type: 'date',
    },
    {
      name: 'acceptedAt',
      type: 'date',
    },
  ],
}
