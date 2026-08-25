import type { PublicHomeData } from '@/lib/public-data'

export type TenantHomeProps = {
  data: PublicHomeData
  ticker: string
}

export function formatShares(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-CA').format(value)
}
