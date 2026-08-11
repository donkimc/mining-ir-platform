import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requirePlatformAdmin } from '@/lib/auth'

export default async function AdminUsersPage() {
  const user = await requirePlatformAdmin()
  const payload = await getPayloadClient()

  const [users, memberships] = await Promise.all([
    payload.find({
      collection: 'users',
      limit: 100,
      depth: 0,
      user,
      overrideAccess: false,
      sort: 'email',
    }),
    payload.find({
      collection: 'tenant-memberships',
      limit: 200,
      depth: 1,
      user,
      overrideAccess: false,
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-4xl text-white">Users & memberships</h1>
        <p className="mt-2 text-[#9db0bc]">
          Platform Admin role is separate from tenant Company Admin memberships.
        </p>
      </div>

      <section>
        <h2 className="display text-2xl text-white">Users</h2>
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {users.docs.map((listedUser) => (
            <li key={listedUser.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-white">{listedUser.name}</p>
                <p className="text-sm text-[#9db0bc]">{listedUser.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={listedUser.status} />
                {listedUser.platformRole ? <StatusBadge status="platform_admin" /> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display text-2xl text-white">Memberships</h2>
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {memberships.docs.map((membership) => {
            const membershipUser =
              membership.user && typeof membership.user === 'object' ? membership.user : null
            const tenant =
              membership.tenant && typeof membership.tenant === 'object'
                ? membership.tenant
                : null
            return (
              <li key={membership.id} className="grid gap-2 p-4 md:grid-cols-4">
                <p>
                  {membershipUser && 'email' in membershipUser
                    ? String(membershipUser.email)
                    : String(membership.user)}
                </p>
                <p>
                  {tenant && 'displayName' in tenant
                    ? String(tenant.displayName)
                    : String(membership.tenant)}
                </p>
                <p className="capitalize">{membership.role.replaceAll('_', ' ')}</p>
                <StatusBadge status={membership.status} />
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
