import { requireCompanyAdmin } from '@/lib/auth'
import { getCompanyById } from '@/lib/tenant'

import { CompanyProfileForm } from './CompanyProfileForm'

export default async function DashboardCompanyPage() {
  const { user, tenantId } = await requireCompanyAdmin()
  const company = await getCompanyById(tenantId, user)

  return <CompanyProfileForm company={company} />
}
