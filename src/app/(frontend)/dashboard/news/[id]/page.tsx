import { notFound } from 'next/navigation'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { listTenantProjects } from '@/lib/dashboard-crud'
import { relationId } from '@/lib/publishing'

import { NewsForm } from '../NewsForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditNewsPage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let news
  try {
    news = await payload.findByID({
      collection: 'news-releases',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(news.tenant)) !== String(tenantId)) {
    notFound()
  }

  const projects = await listTenantProjects(tenantId, user)
  return <NewsForm mode="edit" newsId={String(news.id)} initial={news as never} projects={projects} />
}
