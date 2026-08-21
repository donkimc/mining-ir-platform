import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import {
  getPublishedNews,
  getPublishedNewsBySlug,
  getPublishedDocuments,
  getPublishedPeople,
} from '@/lib/public-data'
import {
  NEWS_DISCLOSURE_FIELDS,
  assertDisclosureWriteAllowed,
  assertSourceReferenceRequired,
  stripForgedReviewMetadata,
} from '@/lib/publishing'

function asTenantId(id: string | number): number {
  return id as unknown as number
}

function asProjectId(id: string | number): number {
  return id as unknown as number
}

describe('Sprint 2 mining content', () => {
  let payload: Payload
  let qelvarionId: string | number
  let zenthoriqId: string | number
  let companyAdmin: { id: string | number; email: string }
  let platformAdmin: { id: string | number }
  let qelvarionProjectId: string | number
  const createdIds: Array<{ collection: string; id: string | number }> = []

  beforeAll(async () => {
    payload = await getPayload({ config })

    const qelvarion = await payload.find({
      collection: 'companies',
      where: { slug: { equals: 'qelvarion-resource' } },
      limit: 1,
      overrideAccess: true,
    })
    const zenthoriq = await payload.find({
      collection: 'companies',
      where: { slug: { equals: 'zenthoriq-resource' } },
      limit: 1,
      overrideAccess: true,
    })
    qelvarionId = qelvarion.docs[0].id
    zenthoriqId = zenthoriq.docs[0].id

    const admins = await payload.find({
      collection: 'users',
      where: { email: { equals: 'admin@qelvarion.local' } },
      limit: 1,
      overrideAccess: true,
    })
    companyAdmin = admins.docs[0] as { id: string | number; email: string }

    const platforms = await payload.find({
      collection: 'users',
      where: { email: { equals: 'platform@mining-ir.local' } },
      limit: 1,
      overrideAccess: true,
    })
    platformAdmin = platforms.docs[0] as { id: string | number }

    const project = await payload.find({
      collection: 'projects',
      where: {
        and: [{ tenant: { equals: qelvarionId } }, { slug: { equals: 'northridge-belt' } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    qelvarionProjectId = project.docs[0].id
  })

  afterEach(async () => {
    while (createdIds.length) {
      const item = createdIds.pop()
      if (!item) break
      try {
        await payload.delete({
          collection: item.collection as 'news-releases',
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // already removed
      }
    }
  })

  it('allows company admin to create own-tenant news as draft', async () => {
    const created = await payload.create({
      collection: 'news-releases',
      user: companyAdmin,
      overrideAccess: false,
      data: {
        tenant: asTenantId(qelvarionId),
        title: 'Own Tenant Draft News',
        slug: `own-news-${Date.now()}`,
        releaseDate: '2026-08-12',
        excerpt: 'Own tenant excerpt for isolation testing.',
        body: 'Own tenant body with enough characters for validation.',
        sourceUrl: 'https://example.com/own-news',
        disclosureLevel: 'standard',
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'news-releases', id: created.id })
    expect(created.status).toBe('draft')
  })

  it('rejects company admin create for another tenant', async () => {
    await expect(
      payload.create({
        collection: 'news-releases',
        user: companyAdmin,
        overrideAccess: false,
        data: {
          tenant: asTenantId(zenthoriqId),
          title: 'Wrong Tenant News',
          slug: `wrong-news-${Date.now()}`,
          releaseDate: '2026-08-12',
          excerpt: 'Should fail for wrong tenant.',
          body: 'Should fail for wrong tenant body content.',
          sourceUrl: 'https://example.com/wrong-news',
          disclosureLevel: 'standard',
          status: 'draft',
        },
      }),
    ).rejects.toThrow()
  })

  it('rejects relating a project from another tenant', async () => {
    const zenthoriqProject = await payload.create({
      collection: 'projects',
      overrideAccess: true,
      data: {
        tenant: asTenantId(zenthoriqId),
        name: 'Zenthoriq Isolation Project',
        slug: `zenthoriq-proj-${Date.now()}`,
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'projects', id: zenthoriqProject.id })

    await expect(
      payload.create({
        collection: 'news-releases',
        user: companyAdmin,
        overrideAccess: false,
        data: {
          tenant: asTenantId(qelvarionId),
          title: 'Cross Tenant Project News',
          slug: `cross-proj-${Date.now()}`,
          project: asProjectId(zenthoriqProject.id),
          releaseDate: '2026-08-12',
          excerpt: 'Should reject cross-tenant project relation.',
          body: 'Should reject cross-tenant project relation body.',
          sourceUrl: 'https://example.com/cross-proj',
          disclosureLevel: 'standard',
          status: 'draft',
        },
      }),
    ).rejects.toThrow(/same tenant/i)
  })

  it('public helpers return published news only', async () => {
    const slug = `pub-news-${Date.now()}`
    const draft = await payload.create({
      collection: 'news-releases',
      overrideAccess: true,
      data: {
        tenant: asTenantId(qelvarionId),
        title: 'Public Filter Draft',
        slug: `${slug}-draft`,
        releaseDate: '2026-08-12',
        excerpt: 'Draft excerpt should stay private.',
        body: 'Draft body should stay private from public helpers.',
        sourceUrl: 'https://example.com/pub-filter-draft',
        disclosureLevel: 'standard',
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'news-releases', id: draft.id })

    const published = await payload.create({
      collection: 'news-releases',
      overrideAccess: true,
      data: {
        tenant: asTenantId(qelvarionId),
        title: 'Public Filter Published',
        slug,
        releaseDate: '2026-08-12',
        excerpt: 'Published excerpt visible publicly.',
        body: 'Published body visible publicly for Sprint 2 tests.',
        sourceUrl: 'https://example.com/pub-filter',
        disclosureLevel: 'standard',
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'news-releases', id: published.id })
    await payload.update({
      collection: 'news-releases',
      id: published.id,
      data: { status: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    await payload.update({
      collection: 'news-releases',
      id: published.id,
      data: { status: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })

    const list = await getPublishedNews(qelvarionId)
    expect(list.some((item) => item.slug === slug)).toBe(true)
    expect(list.some((item) => item.slug === `${slug}-draft`)).toBe(false)
    expect(list.every((item) => !('reviewedBy' in item && item.reviewedBy))).toBe(true)

    const detail = await getPublishedNewsBySlug(qelvarionId, slug)
    expect(detail?.title).toBe('Public Filter Published')
    const draftDetail = await getPublishedNewsBySlug(qelvarionId, `${slug}-draft`)
    expect(draftDetail).toBeNull()
  })

  it('scopes anonymous API reads to the resolved tenant and strips review metadata', async () => {
    const anon = await payload.find({
      collection: 'news-releases',
      limit: 100,
      depth: 0,
      overrideAccess: false,
    })

    expect(anon.docs.length).toBeGreaterThan(0)
    // L-1: tenant relation IDs are stripped from anonymous public docs.
    expect(anon.docs.every((doc) => !('tenant' in doc && doc.tenant != null))).toBe(true)
    expect(anon.docs.some((doc) => doc.slug === 'zenthoriq-isolation-release')).toBe(false)
    expect(
      anon.docs.every(
        (doc) =>
          doc.reviewedBy == null && doc.reviewedAt == null && doc.publishedAt == null,
      ),
    ).toBe(true)
  })

  it('scopes anonymous Sprint 1 collection reads and strips review metadata', async () => {
    // Ensure the Zenthoriq Resource fixture exists — its absence hid this leak previously.
    const zenthoriqHighlight = await payload.find({
      collection: 'investment-highlights',
      where: {
        and: [
          { tenant: { equals: zenthoriqId } },
          { title: { equals: 'ZENTHORIQ SECRET' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (zenthoriqHighlight.totalDocs === 0) {
      const created = await payload.create({
        collection: 'investment-highlights',
        overrideAccess: true,
        data: {
          tenant: asTenantId(zenthoriqId),
          title: 'ZENTHORIQ SECRET',
          summary: 'Isolation fixture highlight for anonymous tenant-scope tests.',
          displayOrder: 99,
          status: 'published',
        },
      })
      createdIds.push({ collection: 'investment-highlights', id: created.id })
    }

    for (const collection of ['projects', 'investment-highlights', 'catalysts'] as const) {
      const anon = await payload.find({
        collection,
        limit: 100,
        depth: 0,
        overrideAccess: false,
      })
      expect(anon.docs.length).toBeGreaterThan(0)
      // L-1: tenant IDs stripped; isolation proven by published-only + no Zenthoriq poison.
      expect(anon.docs.every((doc) => !('tenant' in doc && doc.tenant != null))).toBe(true)
      expect(anon.docs.every((doc) => doc.status === 'published')).toBe(true)
      expect(
        anon.docs.every(
          (doc) =>
            !('reviewedBy' in doc && doc.reviewedBy) &&
            !('reviewedAt' in doc && doc.reviewedAt) &&
            !('publishedAt' in doc && doc.publishedAt),
        ),
      ).toBe(true)
    }

    const highlights = await payload.find({
      collection: 'investment-highlights',
      limit: 100,
      depth: 0,
      overrideAccess: false,
    })
    expect(highlights.docs.some((doc) => doc.title === 'ZENTHORIQ SECRET')).toBe(false)

    const companies = await payload.find({
      collection: 'companies',
      limit: 100,
      depth: 0,
      overrideAccess: false,
    })
    expect(companies.docs).toHaveLength(1)
    expect((companies.docs[0] as { slug?: string }).slug).toBe('qelvarion-resource')
    expect(
      companies.docs.every(
        (doc) =>
          !('reviewedBy' in doc && doc.reviewedBy) &&
          !('reviewedAt' in doc && doc.reviewedAt) &&
          !('publishedAt' in doc && doc.publishedAt) &&
          !('websiteDomain' in doc && doc.websiteDomain) &&
          !('subdomain' in doc && doc.subdomain) &&
          !('templateKey' in doc && doc.templateKey),
      ),
    ).toBe(true)

    const tenantIdOf = (doc: { tenant?: unknown }) => {
      const tenant = doc.tenant
      return typeof tenant === 'object' && tenant && 'id' in tenant
        ? String((tenant as { id: string | number }).id)
        : String(tenant)
    }

    const companyAdminUser = companyAdmin
    const adminProjects = await payload.find({
      collection: 'projects',
      user: companyAdminUser,
      overrideAccess: false,
      limit: 100,
      depth: 0,
    })
    expect(adminProjects.docs.every((doc) => tenantIdOf(doc) === String(qelvarionId))).toBe(true)

    const platformProjects = await payload.find({
      collection: 'projects',
      user: platformAdmin,
      overrideAccess: false,
      limit: 100,
      depth: 0,
    })
    expect(platformProjects.docs.some((doc) => tenantIdOf(doc) === String(zenthoriqId))).toBe(true)
  })

  it('rejects published disclosure edits and content-plus-approve', () => {
    expect(() =>
      assertDisclosureWriteAllowed({
        fields: NEWS_DISCLOSURE_FIELDS,
        data: { body: 'changed' },
        originalDoc: { body: 'original' },
        previousStatus: 'published',
        incomingStatus: 'published',
      }),
    ).toThrow(/Published disclosure fields cannot be edited/i)

    expect(() =>
      assertDisclosureWriteAllowed({
        fields: NEWS_DISCLOSURE_FIELDS,
        data: { status: 'published', body: 'changed' },
        originalDoc: { body: 'original' },
        previousStatus: 'review',
        incomingStatus: 'published',
      }),
    ).toThrow(/status-only/i)
  })

  it('requires source reference before review/published', () => {
    expect(() =>
      assertSourceReferenceRequired({
        data: { title: 'No source' },
        incomingStatus: 'review',
      }),
    ).toThrow(/source URL or source document/i)
  })

  it('strips forged reviewer metadata', () => {
    const cleaned = stripForgedReviewMetadata({
      title: 'x',
      reviewedBy: 999,
      reviewedAt: '2020-01-01',
      publishedAt: '2020-01-01',
    })
    expect(cleaned.reviewedBy).toBeUndefined()
    expect(cleaned.reviewedAt).toBeUndefined()
    expect(cleaned.publishedAt).toBeUndefined()
  })

  it('allows status-only approval and sets server review metadata', async () => {
    const created = await payload.create({
      collection: 'news-releases',
      overrideAccess: true,
      data: {
        tenant: asTenantId(qelvarionId),
        title: 'Approval Path News',
        slug: `approve-news-${Date.now()}`,
        releaseDate: '2026-08-12',
        excerpt: 'Approval path excerpt for status-only publish.',
        body: 'Approval path body for status-only publish testing.',
        sourceUrl: 'https://example.com/approve-news',
        disclosureLevel: 'standard',
        status: 'draft',
        reviewedBy: 99999,
      },
    })
    createdIds.push({ collection: 'news-releases', id: created.id })

    await payload.update({
      collection: 'news-releases',
      id: created.id,
      data: { status: 'review' },
      overrideAccess: true,
      user: platformAdmin,
    })
    const published = await payload.update({
      collection: 'news-releases',
      id: created.id,
      data: { status: 'published' },
      overrideAccess: true,
      user: platformAdmin,
    })

    expect(published.status).toBe('published')
    const reviewedBy = (published as { reviewedBy?: unknown }).reviewedBy
    const reviewedById =
      reviewedBy && typeof reviewedBy === 'object' && reviewedBy !== null && 'id' in reviewedBy
        ? (reviewedBy as { id: string | number }).id
        : reviewedBy
    expect(String(reviewedById)).toBe(String(platformAdmin.id))
    expect((published as { reviewedAt?: unknown }).reviewedAt).toBeTruthy()
  })

  it('publishes documents and people helpers exclude drafts', async () => {
    const docs = await getPublishedDocuments(qelvarionId)
    const people = await getPublishedPeople(qelvarionId)
    expect(docs.every((doc) => doc.status === 'published')).toBe(true)
    expect(people.every((person) => person.status === 'published')).toBe(true)
    expect(docs.some((doc) => doc.slug === 'draft-technical-memo')).toBe(false)
  })

  it('rejects exploration content with wrong-tenant project', async () => {
    const zenthoriqProject = await payload.create({
      collection: 'projects',
      overrideAccess: true,
      data: {
        tenant: asTenantId(zenthoriqId),
        name: 'Zenthoriq Exploration Host',
        slug: `zenthoriq-exp-host-${Date.now()}`,
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'projects', id: zenthoriqProject.id })

    await expect(
      payload.create({
        collection: 'exploration-contents',
        user: companyAdmin,
        overrideAccess: false,
        data: {
          tenant: asTenantId(qelvarionId),
          project: asProjectId(zenthoriqProject.id),
          title: 'Bad Exploration Link',
          contentDate: '2026-08-12',
          summary: 'Should fail because project tenant differs.',
          technicalDetails: 'Should fail because project tenant differs technically.',
          sourceUrl: 'https://example.com/bad-exploration',
          disclosureLevel: 'technical',
          status: 'draft',
        },
      }),
    ).rejects.toThrow(/same tenant/i)
  })

  it('can create exploration on own project', async () => {
    const created = await payload.create({
      collection: 'exploration-contents',
      user: companyAdmin,
      overrideAccess: false,
      data: {
        tenant: asTenantId(qelvarionId),
        project: asProjectId(qelvarionProjectId),
        title: 'Own Exploration Note',
        contentDate: '2026-08-12',
        summary: 'Own tenant exploration summary for tests.',
        technicalDetails: 'Own tenant technical details for exploration tests.',
        sourceUrl: 'https://example.com/own-exploration',
        disclosureLevel: 'technical',
        status: 'draft',
      },
    })
    createdIds.push({ collection: 'exploration-contents', id: created.id })
    expect(created.status).toBe('draft')
  })
})
