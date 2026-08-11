import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export type AuthUser = {
  id: string | number
  email?: string | null
  platformRole?: 'platform_admin' | null
  status?: string | null
}

function asUser(user: unknown): AuthUser | null {
  if (!user || typeof user !== 'object') return null
  return user as AuthUser
}

export function isPlatformAdmin(user: unknown): boolean {
  const authUser = asUser(user)
  return Boolean(authUser?.platformRole === 'platform_admin' && authUser.status !== 'disabled')
}

export async function getActiveMembershipTenantIds(
  req: PayloadRequest,
  roleFilter?: Array<'company_admin' | 'editor' | 'viewer' | 'platform_admin'>,
): Promise<Array<string | number>> {
  if (!req.user) return []

  const where: Where = {
    and: [
      { user: { equals: req.user.id } },
      { status: { equals: 'active' } },
      ...(roleFilter ? [{ role: { in: roleFilter } }] : []),
    ],
  }

  const memberships = await req.payload.find({
    collection: 'tenant-memberships',
    where,
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return memberships.docs
    .map((doc) => {
      const tenant = doc.tenant
      if (tenant && typeof tenant === 'object' && 'id' in tenant) return tenant.id
      return tenant as string | number
    })
    .filter(Boolean)
}

export async function userHasTenantAccess(
  req: PayloadRequest,
  tenantId: string | number,
  roles?: Array<'company_admin' | 'editor' | 'viewer' | 'platform_admin'>,
): Promise<boolean> {
  if (!req.user) return false
  if (isPlatformAdmin(req.user)) return true

  const tenantIds = await getActiveMembershipTenantIds(req, roles)
  return tenantIds.some((id) => String(id) === String(tenantId))
}

export const platformAdminOnly: Access = ({ req }) => isPlatformAdmin(req.user)

export const tenantScopedRead: Access = async ({ req }) => {
  if (!req.user) return false
  if (isPlatformAdmin(req.user)) return true

  const tenantIds = await getActiveMembershipTenantIds(req)
  if (tenantIds.length === 0) return false

  return {
    tenant: {
      in: tenantIds,
    },
  }
}

export const tenantScopedCompanyAdminWrite: Access = async ({ req }) => {
  if (!req.user) return false
  if (isPlatformAdmin(req.user)) return true

  const tenantIds = await getActiveMembershipTenantIds(req, ['company_admin'])
  if (tenantIds.length === 0) return false

  return {
    tenant: {
      in: tenantIds,
    },
  }
}

export const companiesReadAccess: Access = async ({ req }) => {
  if (!req.user) {
    const where: Where = {
      and: [
        { status: { equals: 'active' } },
        { publicationStatus: { equals: 'published' } },
      ],
    }
    return where
  }

  if (isPlatformAdmin(req.user)) return true

  const tenantIds = await getActiveMembershipTenantIds(req)
  if (tenantIds.length === 0) return false

  return {
    id: {
      in: tenantIds,
    },
  }
}

export const companiesWriteAccess: Access = async ({ req }) => {
  if (!req.user) return false
  if (isPlatformAdmin(req.user)) return true

  const tenantIds = await getActiveMembershipTenantIds(req, ['company_admin'])
  if (tenantIds.length === 0) return false

  return {
    id: {
      in: tenantIds,
    },
  }
}

export const preventTenantFieldChange: FieldAccess = ({ req }) => isPlatformAdmin(req.user)
