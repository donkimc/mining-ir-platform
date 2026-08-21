import { StatusBadge } from '@/components/public/StatusBadge'
import { getPayloadClient, requirePlatformAdmin } from '@/lib/auth'

export default async function AdminTenantsPage() {
  const user = await requirePlatformAdmin()
  const payload = await getPayloadClient()
  const tenants = await payload.find({
    collection: 'companies',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
    sort: 'displayName',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl text-white">Tenants</h1>
        <p className="mt-2 text-[#9db0bc]">
          Platform-wide company list. Qelvarion Resource is the Sprint 1 demo tenant.
        </p>
      </div>
      <ul className="divide-y divide-white/10 border border-white/10">
        {tenants.docs.map((tenant) => (
          <li key={tenant.id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="display text-2xl text-white">{tenant.displayName}</p>
              <p className="text-sm text-[#9db0bc]">
                {tenant.slug} · {tenant.templateKey}
              </p>
            </div>
            <div className="text-sm">
              <p>
                {tenant.tickerSymbol || '—'} {tenant.exchange ? `· ${tenant.exchange}` : ''}
              </p>
              <p className="text-[#9db0bc]">{tenant.jurisdiction || 'Jurisdiction TBD'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={tenant.status} />
              <StatusBadge status={tenant.publicationStatus} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
