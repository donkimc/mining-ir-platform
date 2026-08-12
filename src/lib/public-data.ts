import { getPayloadClient } from '@/lib/auth'
import type {
  Catalyst,
  Company,
  Document,
  ExplorationContent,
  InvestmentHighlight,
  NewsRelease,
  Person,
  Project,
  ShareStructure,
} from '@/payload-types'

function omitReviewFields<T extends object>(doc: T): T {
  // Collection afterRead strips these for anonymous requests; keep as defense for overrideAccess reads.
  const next = { ...(doc as Record<string, unknown>) }
  delete next.reviewedBy
  delete next.reviewedAt
  delete next.publishedAt
  return next as T
}

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
  const doc = result.docs[0] as ShareStructure | undefined
  return doc ? omitReviewFields(doc) : null
}

export async function getPublishedNews(tenantId: string | number): Promise<NewsRelease[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'news-releases',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: '-releaseDate',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as NewsRelease[]).map((doc) => omitReviewFields(doc))
}

export async function getPublishedNewsBySlug(
  tenantId: string | number,
  slug: string,
): Promise<NewsRelease | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'news-releases',
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
  const doc = result.docs[0] as NewsRelease | undefined
  return doc ? omitReviewFields(doc) : null
}

export async function getPublishedDocuments(tenantId: string | number): Promise<Document[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'documents',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: '-publicationDate',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as Document[]).map((doc) => omitReviewFields(doc))
}

export async function getPublishedPeople(tenantId: string | number): Promise<Person[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'people',
    where: {
      and: [{ tenant: { equals: tenantId } }, { status: { equals: 'published' } }],
    },
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as Person[]).map((doc) => omitReviewFields(doc))
}

export async function getPublishedExplorationForProject(
  tenantId: string | number,
  projectId: string | number,
): Promise<ExplorationContent[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'exploration-contents',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { project: { equals: projectId } },
        { status: { equals: 'published' } },
      ],
    },
    sort: '-contentDate',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as ExplorationContent[]).map((doc) => omitReviewFields(doc))
}

export type PublicHomeData = {
  company: Company
  projects: Project[]
  flagship: Project | null
  highlights: InvestmentHighlight[]
  catalysts: Catalyst[]
  shareStructure: ShareStructure | null
  recentNews: NewsRelease[]
  documents: Document[]
}

export async function getPublicHomeData(company: Company): Promise<PublicHomeData> {
  const [projects, highlights, catalysts, shareStructure, recentNews, documents] =
    await Promise.all([
      getPublishedProjects(company.id),
      getPublishedHighlights(company.id),
      getPublishedCatalysts(company.id),
      getPublishedShareStructure(company.id),
      getPublishedNews(company.id),
      getPublishedDocuments(company.id),
    ])

  const flagship = projects.find((project) => project.isFlagship) ?? projects[0] ?? null

  return {
    company,
    projects,
    flagship,
    highlights,
    catalysts,
    shareStructure,
    recentNews: recentNews.slice(0, 3),
    documents: documents.slice(0, 3),
  }
}
