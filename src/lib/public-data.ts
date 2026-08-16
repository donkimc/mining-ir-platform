import { getPayloadClient } from '@/lib/auth'
import { serializeAnonymousPublicDoc } from '@/lib/collection-hooks'
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
import type { Where } from 'payload'

function toPublicDoc<T extends object>(doc: T): T {
  // Collection afterRead strips these for anonymous requests; keep as defense for overrideAccess reads.
  return serializeAnonymousPublicDoc(doc as Record<string, unknown>) as T
}

function nonEmpty(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export type ProjectDiscoveryFilters = {
  q?: string
  commodity?: string
  stage?: string
}

export type NewsDiscoveryFilters = {
  q?: string
}

export type DocumentDiscoveryFilters = {
  q?: string
  category?: string
}

export async function getPublishedProjects(
  tenantId: string | number,
  filters: ProjectDiscoveryFilters = {},
): Promise<Project[]> {
  const payload = await getPayloadClient()
  const and: Where[] = [
    { tenant: { equals: tenantId } },
    { status: { equals: 'published' } },
  ]

  const q = nonEmpty(filters.q)
  if (q) {
    and.push({
      or: [{ name: { contains: q } }, { summary: { contains: q } }],
    })
  }
  const commodity = nonEmpty(filters.commodity)
  if (commodity) {
    and.push({ commodity: { contains: commodity } })
  }
  const stage = nonEmpty(filters.stage)
  if (stage) {
    and.push({ stage: { equals: stage } })
  }

  const result = await payload.find({
    collection: 'projects',
    where: { and },
    sort: 'displayOrder',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as Project[]).map((doc) => toPublicDoc(doc))
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
  const doc = result.docs[0] as Project | undefined
  return doc ? toPublicDoc(doc) : null
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
  return (result.docs as InvestmentHighlight[]).map((doc) => toPublicDoc(doc))
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
  return (result.docs as Catalyst[]).map((doc) => toPublicDoc(doc))
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
  return doc ? toPublicDoc(doc) : null
}

export async function getPublishedNews(
  tenantId: string | number,
  filters: NewsDiscoveryFilters = {},
): Promise<NewsRelease[]> {
  const payload = await getPayloadClient()
  const and: Where[] = [
    { tenant: { equals: tenantId } },
    { status: { equals: 'published' } },
  ]
  const q = nonEmpty(filters.q)
  if (q) {
    and.push({
      or: [{ title: { contains: q } }, { excerpt: { contains: q } }],
    })
  }

  const result = await payload.find({
    collection: 'news-releases',
    where: { and },
    sort: '-releaseDate',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as NewsRelease[]).map((doc) => toPublicDoc(doc))
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
  return doc ? toPublicDoc(doc) : null
}

export async function getPublishedDocuments(
  tenantId: string | number,
  filters: DocumentDiscoveryFilters = {},
): Promise<Document[]> {
  const payload = await getPayloadClient()
  const and: Where[] = [
    { tenant: { equals: tenantId } },
    { status: { equals: 'published' } },
  ]
  const q = nonEmpty(filters.q)
  if (q) {
    and.push({ title: { contains: q } })
  }
  const category = nonEmpty(filters.category)
  if (category) {
    and.push({ category: { equals: category } })
  }

  const result = await payload.find({
    collection: 'documents',
    where: { and },
    sort: '-publicationDate',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs as Document[]).map((doc) => toPublicDoc(doc))
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
  return (result.docs as Person[]).map((doc) => toPublicDoc(doc))
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
  return (result.docs as ExplorationContent[]).map((doc) => toPublicDoc(doc))
}

export type RelatedPublishedContent = {
  news: NewsRelease[]
  documents: Document[]
}

/**
 * Same-tenant Published news and documents linked to a project (ADR-0011).
 */
export async function getRelatedPublishedForProject(
  tenantId: string | number,
  projectId: string | number,
): Promise<RelatedPublishedContent> {
  const payload = await getPayloadClient()
  const [news, documents] = await Promise.all([
    payload.find({
      collection: 'news-releases',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { project: { equals: projectId } },
          { status: { equals: 'published' } },
        ],
      },
      sort: '-releaseDate',
      limit: 10,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'documents',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { project: { equals: projectId } },
          { status: { equals: 'published' } },
        ],
      },
      sort: '-publicationDate',
      limit: 10,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  return {
    news: (news.docs as NewsRelease[]).map((doc) => toPublicDoc(doc)),
    documents: (documents.docs as Document[]).map((doc) => toPublicDoc(doc)),
  }
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
