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

export const DISCLOSURE_LEVELS = ['none', 'standard', 'technical'] as const

export type DisclosureLevel = (typeof DISCLOSURE_LEVELS)[number]

export const DOCUMENT_CATEGORIES = [
  'presentation',
  'technical_report',
  'financial',
  'other',
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export const PERSON_GROUPS = ['management', 'board', 'advisors', 'other'] as const

export type PersonGroup = (typeof PERSON_GROUPS)[number]
