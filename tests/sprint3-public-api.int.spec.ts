import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { serializeAnonymousPublicDoc } from '@/lib/collection-hooks'

const REVIEW_KEYS = ['reviewedBy', 'reviewedAt', 'publishedAt'] as const

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

function tenantIdOf(doc: { tenant?: unknown }): string | null {
  const t = doc.tenant
  if (t == null) return null
  if (typeof t === 'object' && t !== null && 'id' in t) return String((t as { id: unknown }).id)
  return String(t)
}

describe('Sprint 3 public API serializers and tenant isolation', () => {
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

  it('serializeAnonymousPublicDoc strips review audit fields', () => {
    const out = serializeAnonymousPublicDoc({
      id: 1,
      title: 'x',
      reviewedBy: 9,
      reviewedAt: '2026-01-01',
      publishedAt: '2026-01-02',
      status: 'published',
    })
    expect(out).toMatchObject({ id: 1, title: 'x', status: 'published' })
    for (const key of REVIEW_KEYS) {
      expect(out).not.toHaveProperty(key)
    }
  })

  it('anonymous reads of every tenant-owned collection are published-only for Aurora and strip review metadata', async () => {
    for (const collection of TENANT_OWNED_COLLECTIONS) {
      const anon = await payload.find({
        collection,
        limit: 50,
        depth: 0,
        overrideAccess: false,
        user: null,
      })

      expect(anon.docs.every((doc) => (doc as { status?: string }).status === 'published')).toBe(true)
      expect(anon.docs.every((doc) => tenantIdOf(doc as { tenant?: unknown }) === String(auroraId))).toBe(
        true,
      )
      expect(
        anon.docs.every((doc) => REVIEW_KEYS.every((key) => !Object.prototype.hasOwnProperty.call(doc, key))),
      ).toBe(true)
      expect(anon.docs.every((doc) => tenantIdOf(doc as { tenant?: unknown }) !== String(northernId))).toBe(
        true,
      )
    }
  })

  it('anonymous companies list strips review metadata and does not leak draft companies', async () => {
    const anon = await payload.find({
      collection: 'companies',
      limit: 50,
      depth: 0,
      overrideAccess: false,
      user: null,
    })
    expect(anon.docs.length).toBeGreaterThan(0)
    expect(
      anon.docs.every((doc) => REVIEW_KEYS.every((key) => !Object.prototype.hasOwnProperty.call(doc, key))),
    ).toBe(true)
    expect(anon.docs.every((doc) => (doc as { publicationStatus?: string }).publicationStatus === 'published')).toBe(
      true,
    )
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

  it('anonymous investment-highlights never include NORTHERN SECRET', async () => {
    const anon = await payload.find({
      collection: 'investment-highlights',
      limit: 50,
      depth: 0,
      overrideAccess: false,
      user: null,
    })
    expect(anon.docs.some((doc) => (doc as { title?: string }).title === 'NORTHERN SECRET')).toBe(false)
  })
})
