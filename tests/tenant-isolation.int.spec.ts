import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { getPublishedProjectBySlug, getPublishedProjects } from '@/lib/public-data'
import { getPublishedCompanyBySlug } from '@/lib/tenant'
import { companyContentSchema } from '@/lib/schemas/company'
import { projectContentSchema } from '@/lib/schemas/project'

describe('tenant isolation and published-only reads', () => {
  let payload: Payload
  let auroraId: string | number
  let northernId: string | number
  let companyAdminId: string | number
  let platformAdminId: string | number
  const createdProjectIds: Array<string | number> = []

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
    const companyAdmin = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local' } },
      limit: 1,
      overrideAccess: true,
    })
    const platformAdmin = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_PLATFORM_EMAIL || 'platform@mining-ir.local' } },
      limit: 1,
      overrideAccess: true,
    })

    if (!aurora.docs[0] || !northern.docs[0] || !companyAdmin.docs[0] || !platformAdmin.docs[0]) {
      throw new Error('Seed data missing. Run `npm run seed` before integration tests.')
    }

    auroraId = aurora.docs[0].id
    northernId = northern.docs[0].id
    companyAdminId = companyAdmin.docs[0].id
    platformAdminId = platformAdmin.docs[0].id

    // Clean leaked fixtures from earlier interrupted runs.
    const leaked = await payload.find({
      collection: 'projects',
      where: { slug: { contains: 'test-public-flow-' } },
      limit: 100,
      overrideAccess: true,
    })
    for (const doc of leaked.docs) {
      await payload.delete({ collection: 'projects', id: doc.id, overrideAccess: true })
    }
  })

  beforeEach(() => {
    createdProjectIds.length = 0
  })

  afterEach(async () => {
    for (const id of createdProjectIds) {
      try {
        await payload.delete({ collection: 'projects', id, overrideAccess: true })
      } catch {
        // already deleted
      }
    }
    createdProjectIds.length = 0
  })

  it('public project helpers return only published aurora projects', async () => {
    const published = await getPublishedProjects(auroraId)

    expect(published.length).toBeGreaterThan(0)
    expect(published.every((doc) => doc.status === 'published')).toBe(true)
    expect(published.some((doc) => doc.slug === 'hidden-lake')).toBe(false)
  })

  it('draft project slug is not returned by getPublishedProjectBySlug', async () => {
    const draft = await getPublishedProjectBySlug(auroraId, 'hidden-lake')
    expect(draft).toBeNull()
  })

  it('getPublishedCompanyBySlug returns only published active tenants', async () => {
    const company = await getPublishedCompanyBySlug('aurora-gold')
    expect(company?.slug).toBe('aurora-gold')
    expect(company?.publicationStatus).toBe('published')
  })

  it('anonymous access-layer project reads return published only', async () => {
    const anon = await payload.find({
      collection: 'projects',
      overrideAccess: false,
      limit: 50,
    })

    expect(anon.docs.length).toBeGreaterThan(0)
    expect(anon.docs.every((doc) => doc.status === 'published')).toBe(true)
    expect(anon.docs.some((doc) => doc.slug === 'hidden-lake')).toBe(false)
  })

  it('company admin can read own tenant projects and not another tenant via access', async () => {
    const companyAdmin = await payload.findByID({
      collection: 'users',
      id: companyAdminId,
      overrideAccess: true,
    })

    const own = await payload.find({
      collection: 'projects',
      user: companyAdmin,
      overrideAccess: false,
      limit: 50,
    })

    expect(
      own.docs.every(
        (doc) =>
          String(typeof doc.tenant === 'object' ? doc.tenant.id : doc.tenant) === String(auroraId),
      ),
    ).toBe(true)

    await expect(
      payload.update({
        collection: 'companies',
        id: northernId,
        user: companyAdmin,
        overrideAccess: false,
        data: {
          displayName: 'Should Not Update',
        },
      }),
    ).rejects.toThrow()
  })

  it('company admin cannot write another tenant project', async () => {
    const companyAdmin = await payload.findByID({
      collection: 'users',
      id: companyAdminId,
      overrideAccess: true,
    })

    let northernProject = (
      await payload.find({
        collection: 'projects',
        where: { tenant: { equals: northernId } },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0]

    if (!northernProject) {
      northernProject = await payload.create({
        collection: 'projects',
        overrideAccess: true,
        data: {
          tenant: Number(northernId),
          name: 'Northern Fixture',
          slug: `northern-fixture-${Date.now()}`,
          status: 'draft',
          summary: 'Isolation write fixture',
        },
      })
      createdProjectIds.push(northernProject.id)
    }

    await expect(
      payload.update({
        collection: 'projects',
        id: northernProject.id,
        user: companyAdmin,
        overrideAccess: false,
        data: { name: 'Hijacked' },
      }),
    ).rejects.toThrow()
  })

  it('platform admin can list all tenants', async () => {
    const platformAdmin = await payload.findByID({
      collection: 'users',
      id: platformAdminId,
      overrideAccess: true,
    })

    const tenants = await payload.find({
      collection: 'companies',
      user: platformAdmin,
      overrideAccess: false,
      limit: 50,
    })

    const slugs = tenants.docs.map((doc) => doc.slug)
    expect(slugs).toContain('aurora-gold')
    expect(slugs).toContain('northern-copper')
  })

  it('invalid profile/project form schemas reject without partial mutation', () => {
    const badCompany = companyContentSchema.safeParse({
      displayName: 'A',
      shortDescription: 'too short',
    })
    expect(badCompany.success).toBe(false)

    const badProject = projectContentSchema.safeParse({
      name: 'X',
      slug: 'NOT VALID',
    })
    expect(badProject.success).toBe(false)
  })

  it('dashboard publish flow: draft -> review -> published becomes publicly visible', async () => {
    const companyAdmin = await payload.findByID({
      collection: 'users',
      id: companyAdminId,
      overrideAccess: true,
    })

    const slug = `test-public-flow-${Date.now()}`
    let createdId: string | number | null = null

    try {
      const created = await payload.create({
        collection: 'projects',
        user: companyAdmin,
        data: {
          tenant: Number(auroraId),
          name: 'Test Public Flow',
          slug,
          status: 'draft',
          summary: 'Temporary project for dashboard-to-public verification.',
        },
      })
      createdId = created.id
      createdProjectIds.push(created.id)

      await expect(
        payload.update({
          collection: 'projects',
          id: created.id,
          user: companyAdmin,
          data: { status: 'published' },
        }),
      ).rejects.toThrow(/cannot move directly to Published/i)

      await payload.update({
        collection: 'projects',
        id: created.id,
        user: companyAdmin,
        data: { status: 'review' },
      })

      const published = await payload.update({
        collection: 'projects',
        id: created.id,
        user: companyAdmin,
        data: { status: 'published' },
      })

      expect(published.status).toBe('published')
      expect(published.reviewedBy).toBeTruthy()
      expect(published.reviewedAt).toBeTruthy()

      const publicRead = await getPublishedProjectBySlug(auroraId, slug)
      expect(publicRead?.id).toBe(created.id)
    } finally {
      if (createdId != null) {
        await payload.delete({
          collection: 'projects',
          id: createdId,
          overrideAccess: true,
        })
        const idx = createdProjectIds.indexOf(createdId)
        if (idx >= 0) createdProjectIds.splice(idx, 1)
      }
    }
  })

  it('rejects published disclosure edits and leaves public read unchanged (C1)', async () => {
    const companyAdmin = await payload.findByID({
      collection: 'users',
      id: companyAdminId,
      overrideAccess: true,
    })

    const slug = `test-public-flow-${Date.now()}`
    let createdId: string | number | null = null
    const originalSummary =
      'Reviewed technical summary for C1 regression. Baseline intercept language.'

    try {
      const created = await payload.create({
        collection: 'projects',
        user: companyAdmin,
        data: {
          tenant: Number(auroraId),
          name: 'C1 Regression Project',
          slug,
          status: 'draft',
          technicalSummary: originalSummary,
          summary: 'Public summary',
        },
      })
      createdId = created.id
      createdProjectIds.push(created.id)

      await payload.update({
        collection: 'projects',
        id: created.id,
        user: companyAdmin,
        data: { status: 'review' },
      })
      await payload.update({
        collection: 'projects',
        id: created.id,
        user: companyAdmin,
        data: { status: 'published' },
      })

      await expect(
        payload.update({
          collection: 'projects',
          id: created.id,
          user: companyAdmin,
          data: {
            technicalSummary: 'UNREVIEWED MATERIAL CLAIM: 45 g/t Au over 30m.',
          },
        }),
      ).rejects.toThrow(/Published disclosure fields cannot be edited/i)

      await expect(
        payload.update({
          collection: 'projects',
          id: created.id,
          user: companyAdmin,
          data: {
            status: 'published',
            technicalSummary: 'Sneaky approve-time rewrite',
          },
        }),
      ).rejects.toThrow()

      const publicRead = await getPublishedProjectBySlug(auroraId, slug)
      expect(publicRead?.technicalSummary).toBe(originalSummary)
    } finally {
      if (createdId != null) {
        await payload.delete({
          collection: 'projects',
          id: createdId,
          overrideAccess: true,
        })
        const idx = createdProjectIds.indexOf(createdId)
        if (idx >= 0) createdProjectIds.splice(idx, 1)
      }
    }
  })
})
