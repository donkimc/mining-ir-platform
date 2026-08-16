import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { serializeAnonymousPublicDoc } from '@/lib/collection-hooks'
import {
  getPublishedNews,
  getPublishedProjects,
  getRelatedPublishedForProject,
} from '@/lib/public-data'
import { isValidMapCoordinate } from '@/components/public/ProjectLocationMap'

const REVIEW_KEYS = ['reviewedBy', 'reviewedAt', 'publishedAt'] as const
const PLATFORM_KEYS = ['websiteDomain', 'subdomain', 'templateKey'] as const

const TENANT_OWNED_COLLECTIONS = [
  'projects',
  'news-releases',
  'documents',
  'people',
  'share-structures',
  'exploration-contents',
  'investment-highlights',
  'catalysts',
] as const

const NORTHERN_POISON = [
  'NORTHERN SECRET',
  'NORTHERN CATALYST SECRET',
  'Copper Ridge Isolation',
  'copper-ridge-isolation',
  'Northern Copper Isolation',
  '54.123456',
  '-125.654321',
] as const

function tenantIdOf(doc: { tenant?: unknown }): string | null {
  const t = doc.tenant
  if (t == null) return null
  if (typeof t === 'object' && t !== null && 'id' in t) return String((t as { id: unknown }).id)
  return String(t)
}

function jsonHasPoison(value: unknown): boolean {
  const text = JSON.stringify(value)
  return NORTHERN_POISON.some((poison) => text.includes(poison))
}

describe('Sprint 3/4 public API serializers and tenant isolation', () => {
  let payload: Payload
  let auroraId: string | number
  let northernId: string | number
  let companyAdmin: { id: string | number }
  let platformAdmin: { id: string | number }

  beforeAll(async () => {
    payload = await getPayload({ config })

    const aurora = await payload.find({
      collection: 'companies',
      where: { slug: { equals: 'aurora-gold' } },
      limit: 1,
      overrideAccess: true,
    })
    const northern = await payload.find({
      collection: 'companies',
      where: { slug: { equals: 'northern-copper' } },
      limit: 1,
      overrideAccess: true,
    })
    if (!aurora.docs[0] || !northern.docs[0]) {
      throw new Error('Seed data missing. Run `npm run seed` before integration tests.')
    }
    auroraId = aurora.docs[0].id
    northernId = northern.docs[0].id

    const admins = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local' } },
      limit: 1,
      overrideAccess: true,
    })
    companyAdmin = admins.docs[0] as { id: string | number }

    const platforms = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_PLATFORM_EMAIL || 'platform@mining-ir.local' } },
      limit: 1,
      overrideAccess: true,
    })
    platformAdmin = platforms.docs[0] as { id: string | number }
  })

  it('serializeAnonymousPublicDoc strips review, tenant and platform routing fields', () => {
    const out = serializeAnonymousPublicDoc({
      id: 1,
      title: 'x',
      reviewedBy: 9,
      reviewedAt: '2026-01-01',
      publishedAt: '2026-01-02',
      tenant: 42,
      websiteDomain: 'example.com',
      subdomain: 'aurora',
      templateKey: 'explorer',
      status: 'published',
    })
    expect(out).toMatchObject({ id: 1, title: 'x', status: 'published' })
    for (const key of [...REVIEW_KEYS, 'tenant', ...PLATFORM_KEYS]) {
      expect(out).not.toHaveProperty(key)
    }
  })

  it('anonymous reads of every tenant-owned collection are published-only, strip internals, and exclude Northern poison', async () => {
    for (const collection of TENANT_OWNED_COLLECTIONS) {
      const anon = await payload.find({
        collection,
        limit: 50,
        depth: 0,
        overrideAccess: false,
        user: null,
      })

      expect(anon.docs.every((doc) => (doc as { status?: string }).status === 'published')).toBe(true)
      expect(
        anon.docs.every((doc) => REVIEW_KEYS.every((key) => !Object.prototype.hasOwnProperty.call(doc, key))),
      ).toBe(true)
      expect(anon.docs.every((doc) => !Object.prototype.hasOwnProperty.call(doc, 'tenant'))).toBe(true)
      expect(jsonHasPoison(anon.docs)).toBe(false)
    }
  })

  it('M-1: anonymous companies list returns only the resolved tenant without platform internals', async () => {
    const anon = await payload.find({
      collection: 'companies',
      limit: 50,
      depth: 0,
      overrideAccess: false,
      user: null,
    })
    expect(anon.docs).toHaveLength(1)
    const company = anon.docs[0] as unknown as Record<string, unknown>
    expect(company.slug).toBe(process.env.DEFAULT_TENANT_SLUG || 'aurora-gold')
    expect(company.publicationStatus).toBe('published')
    for (const key of [...REVIEW_KEYS, ...PLATFORM_KEYS, 'tenant']) {
      expect(company).not.toHaveProperty(key)
    }
    expect(jsonHasPoison(anon.docs)).toBe(false)
  })

  it('S4-2: anonymous media reads strip tenant (L-1 contract)', async () => {
    const anon = await payload.find({
      collection: 'media',
      limit: 5,
      // Intentionally omit depth:0 here — afterRead + beforeOperation must still strip tenant
      // even if a caller would otherwise expand the relation.
      overrideAccess: false,
      user: null,
    })
    expect(anon.docs.length).toBeGreaterThan(0)
    for (const doc of anon.docs) {
      expect(Object.prototype.hasOwnProperty.call(doc, 'tenant')).toBe(false)
      for (const key of REVIEW_KEYS) {
        expect(Object.prototype.hasOwnProperty.call(doc, key)).toBe(false)
      }
    }
  })

  it('company admin still sees own-tenant drafts including review metadata fields when present', async () => {
    const drafts = await payload.find({
      collection: 'news-releases',
      where: {
        and: [{ tenant: { equals: auroraId } }, { status: { equals: 'draft' } }],
      },
      limit: 5,
      depth: 0,
      overrideAccess: false,
      user: companyAdmin,
    })
    expect(drafts.docs.length).toBeGreaterThan(0)
    expect(drafts.docs.every((doc) => tenantIdOf(doc as { tenant?: unknown }) === String(auroraId))).toBe(true)
  })

  it('platform admin can read across tenants', async () => {
    const highlights = await payload.find({
      collection: 'investment-highlights',
      limit: 50,
      depth: 0,
      overrideAccess: false,
      user: platformAdmin,
    })
    const tenants = new Set(highlights.docs.map((doc) => tenantIdOf(doc as { tenant?: unknown })))
    expect(tenants.has(String(auroraId))).toBe(true)
    expect(tenants.has(String(northernId))).toBe(true)
  })

  it('L-2: Northern Copper poison fixtures exist for projects, highlights and catalysts', async () => {
    const [projects, highlights, catalysts] = await Promise.all([
      payload.find({
        collection: 'projects',
        where: {
          and: [{ tenant: { equals: northernId } }, { slug: { equals: 'copper-ridge-isolation' } }],
        },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'investment-highlights',
        where: {
          and: [{ tenant: { equals: northernId } }, { title: { equals: 'NORTHERN SECRET' } }],
        },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'catalysts',
        where: {
          and: [
            { tenant: { equals: northernId } },
            { title: { equals: 'NORTHERN CATALYST SECRET' } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      }),
    ])
    expect(projects.docs[0]).toBeTruthy()
    expect(highlights.docs[0]).toBeTruthy()
    expect(catalysts.docs[0]).toBeTruthy()
  })

  it('anonymous investment-highlights and catalysts never include Northern poison titles', async () => {
    const [highlights, catalysts] = await Promise.all([
      payload.find({
        collection: 'investment-highlights',
        limit: 50,
        depth: 0,
        overrideAccess: false,
        user: null,
      }),
      payload.find({
        collection: 'catalysts',
        limit: 50,
        depth: 0,
        overrideAccess: false,
        user: null,
      }),
    ])
    expect(highlights.docs.some((doc) => (doc as { title?: string }).title === 'NORTHERN SECRET')).toBe(
      false,
    )
    expect(
      catalysts.docs.some((doc) => (doc as { title?: string }).title === 'NORTHERN CATALYST SECRET'),
    ).toBe(false)
  })

  it('discovery queries return Published Aurora matches and exclude Draft/Northern poison', async () => {
    const projects = await getPublishedProjects(auroraId, { q: 'Ridge' })
    expect(projects.length).toBeGreaterThan(0)
    expect(projects.every((p) => p.status === 'published')).toBe(true)
    expect(jsonHasPoison(projects)).toBe(false)
    expect(projects.every((p) => !Object.prototype.hasOwnProperty.call(p, 'tenant'))).toBe(true)

    const empty = await getPublishedProjects(auroraId, { q: 'NORTHERN SECRET' })
    expect(empty).toHaveLength(0)

    const news = await getPublishedNews(auroraId, { q: 'draft-should-not-match-zzz' })
    expect(news).toHaveLength(0)
  })

  it('related published content stays same-tenant and published-only', async () => {
    const auroraProjects = await payload.find({
      collection: 'projects',
      where: {
        and: [{ tenant: { equals: auroraId } }, { status: { equals: 'published' } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    const project = auroraProjects.docs[0]
    expect(project).toBeTruthy()
    const related = await getRelatedPublishedForProject(auroraId, project!.id)
    expect(jsonHasPoison(related)).toBe(false)
    expect(related.news.every((n) => n.status === 'published')).toBe(true)
    expect(related.documents.every((d) => d.status === 'published')).toBe(true)

    const northernProjects = await payload.find({
      collection: 'projects',
      where: { tenant: { equals: northernId } },
      limit: 1,
      overrideAccess: true,
    })
    const northernProject = northernProjects.docs[0]
    expect(northernProject).toBeTruthy()
    const cross = await getRelatedPublishedForProject(auroraId, northernProject!.id)
    expect(cross.news).toHaveLength(0)
    expect(cross.documents).toHaveLength(0)
  })

  it('map coordinate helper accepts valid Published coords and rejects invalid', () => {
    expect(isValidMapCoordinate(64.8, -147.7)).toBe(true)
    expect(isValidMapCoordinate(null, -147.7)).toBe(false)
    expect(isValidMapCoordinate(91, 0)).toBe(false)
    expect(isValidMapCoordinate(0, 181)).toBe(false)
    expect(isValidMapCoordinate(Number.NaN, 0)).toBe(false)
  })
})
