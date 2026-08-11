import { getPayloadClient } from '@/lib/auth'
import type {
  Catalyst,
  Company,
  InvestmentHighlight,
  Project,
  ShareStructure,
} from '@/payload-types'

export async function getPublishedProjects(tenantId: string | number): Promise<Project[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs as Project[]
}

export async function getPublishedProjectBySlug(
  tenantId: string | number,
  slug: string,
): Promise<Project | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs[0] as Project | undefined) ?? null
}

export async function getPublishedHighlights(
  tenantId: string | number,
): Promise<InvestmentHighlight[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'investment-highlights',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: 'displayOrder',
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs as InvestmentHighlight[]
}

export async function getPublishedCatalysts(tenantId: string | number): Promise<Catalyst[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'catalysts',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: 'displayOrder',
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs as Catalyst[]
}

export async function getPublishedShareStructure(
  tenantId: string | number,
): Promise<ShareStructure | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'share-structures',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: '-asOfDate',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs[0] as ShareStructure | undefined) ?? null
}

export type PublicHomeData = {
  company: Company
  projects: Project[]
  flagship: Project | null
  highlights: InvestmentHighlight[]
  catalysts: Catalyst[]
  shareStructure: ShareStructure | null
}

export async function getPublicHomeData(company: Company): Promise<PublicHomeData> {
  const [projects, highlights, catalysts, shareStructure] = await Promise.all([
    getPublishedProjects(company.id),
    getPublishedHighlights(company.id),
    getPublishedCatalysts(company.id),
    getPublishedShareStructure(company.id),
  ])

  const flagship = projects.find((project) => project.isFlagship) ?? projects[0] ?? null

  return {
    company,
    projects,
    flagship,
    highlights,
    catalysts,
    shareStructure,
  }
}
