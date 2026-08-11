import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

import { isPlatformAdmin, type AuthUser } from '@/access'

export async function getPayloadClient() {
  return getPayload({ config })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await getPayloadClient()
  const headerStore = await nextHeaders()
  const { user } = await payload.auth({ headers: headerStore })
  return (user as AuthUser | null) ?? null
}

export async function requireUser(loginRedirect = '/login'): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(loginRedirect)
  }
  return user
}

export async function requirePlatformAdmin(): Promise<AuthUser> {
  const user = await requireUser('/login?next=/admin/tenants')
  if (!isPlatformAdmin(user)) {
    redirect('/login?error=unauthorized')
  }
  return user
}

async function findActiveCompanyAdminTenantId(userId: string | number) {
  const payload = await getPayloadClient()
  const memberships = await payload.find({
    collection: 'tenant-memberships',
    where: {
      and: [
        { user: { equals: userId } },
        { status: { equals: 'active' } },
        { role: { equals: 'company_admin' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const membership = memberships.docs[0]
  if (!membership) return null

  const tenant = membership.tenant
  if (tenant && typeof tenant === 'object' && 'id' in tenant) return tenant.id
  return (tenant as string | number) ?? null
}

export async function requireCompanyAdmin(): Promise<{
  user: AuthUser
  tenantId: string | number
}> {
  const user = await requireUser('/login?next=/dashboard')

  if (isPlatformAdmin(user)) {
    const tenantId = await findActiveCompanyAdminTenantId(user.id)
    if (tenantId) return { user, tenantId }
    redirect('/admin/tenants')
  }

  const tenantId = await findActiveCompanyAdminTenantId(user.id)
  if (!tenantId) {
    redirect('/login?error=unauthorized')
  }

  return { user, tenantId }
}
