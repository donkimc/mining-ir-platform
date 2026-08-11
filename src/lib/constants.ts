export const PUBLICATION_STATUSES = ['draft', 'review', 'published', 'archived'] as const

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]

export const MEMBERSHIP_ROLES = ['platform_admin', 'company_admin', 'editor', 'viewer'] as const

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export const TENANT_STATUSES = ['active', 'suspended', 'provisioning'] as const

export type TenantStatus = (typeof TENANT_STATUSES)[number]

export const USER_STATUSES = ['active', 'invited', 'disabled'] as const

export type UserStatus = (typeof USER_STATUSES)[number]

export const MEMBERSHIP_STATUSES = ['active', 'invited', 'revoked'] as const

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

export const PROJECT_STAGES = [
  'early_exploration',
  'advanced_exploration',
  'resource_definition',
  'development',
  'production',
] as const

export type ProjectStage = (typeof PROJECT_STAGES)[number]
