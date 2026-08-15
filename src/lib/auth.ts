import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

import { isPlatformAdmin, type AuthUser } from '@/access'

export async function getPayloadClient() {
  return getPayload({ config })
}

/**
 * Build headers Payload can authenticate from.
 * Next.js App Router soft navigations (RSC fetches) can present Cookie/Origin in ways
 * that make Payload's cookie extractor drop the session — login works, then menu clicks
 * bounce to /login. Reading `payload-token` via `cookies()` and sending
 * `Authorization: JWT …` uses Payload's first jwtOrder strategy and stays stable.
 */
export async function getAuthHeaders(): Promise<Headers> {
  const headerStore = await nextHeaders()
  const requestHeaders = new Headers(headerStore)
  const cookieStore = await nextCookies()
  const token = cookieStore.get('payload-token')?.value

  if (token) {
    if (!requestHeaders.get('authorization')) {
      requestHeaders.set('Authorization', `JWT ${token}`)
    }
    const existingCookie = requestHeaders.get('cookie')
    if (!existingCookie?.includes('payload-token=')) {
      requestHeaders.set(
        'cookie',
        existingCookie ? `${existingCookie}; payload-token=${token}` : `payload-token=${token}`,
      )
    }
  }

  return requestHeaders
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getAuthHeaders() })
  return (user as AuthUser | null) ?? null
}

export async function requireUser(loginRedirect = '/login'): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user || user.status !== 'active') {
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

type MembershipLookup =
  | { kind: 'none' }
  | { kind: 'single'; tenantId: string | number }
  | { kind: 'multiple' }

async function findActiveCompanyAdminMemberships(userId: string | number): Promise<MembershipLookup> {
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
    sort: 'createdAt',
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })

  if (memberships.docs.length === 0) return { kind: 'none' }
  if (memberships.totalDocs > 1 || memberships.docs.length > 1) return { kind: 'multiple' }

  const tenant = memberships.docs[0].tenant
  const tenantId =
    tenant && typeof tenant === 'object' && 'id' in tenant
      ? tenant.id
      : (tenant as string | number)

  return { kind: 'single', tenantId }
}

export async function requireCompanyAdmin(): Promise<{
  user: AuthUser
  tenantId: string | number
}> {
  const user = await requireUser('/login?next=/dashboard')

  if (isPlatformAdmin(user)) {
    const membership = await findActiveCompanyAdminMemberships(user.id)
    if (membership.kind === 'single') return { user, tenantId: membership.tenantId }
    if (membership.kind === 'multiple') redirect('/login?error=multi-tenant')
    redirect('/admin/tenants')
  }

  const membership = await findActiveCompanyAdminMemberships(user.id)
  if (membership.kind === 'multiple') {
    redirect('/login?error=multi-tenant')
  }
  if (membership.kind === 'none') {
    redirect('/login?error=unauthorized')
  }

  return { user, tenantId: membership.tenantId }
}
