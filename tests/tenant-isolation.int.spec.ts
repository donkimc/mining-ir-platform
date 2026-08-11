import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'

describe('tenant isolation and published-only reads', () => {
  let payload: Payload
  let auroraId: string | number
  let northernId: string | number
  let companyAdminId: string | number
  let platformAdminId: string | number

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
  })

  afterAll(async () => {
    // Payload keeps a pool open; vitest process exit handles cleanup.
  })

  it('public project queries return only published aurora projects', async () => {
    const published = await payload.find({
      collection: 'projects',
      where: {
        and: [{ tenant: { equals: auroraId } }, { status: { equals: 'published' } }],
      },
      overrideAccess: true,
      limit: 50,
    })

    expect(published.docs.length).toBeGreaterThan(0)
    expect(published.docs.every((doc) => doc.status === 'published')).toBe(true)
    expect(published.docs.some((doc) => doc.slug === 'hidden-lake')).toBe(false)
  })

  it('draft project slug is not returned by published query', async () => {
    const draft = await payload.find({
      collection: 'projects',
      where: {
        and: [
          { tenant: { equals: auroraId } },
          { slug: { equals: 'hidden-lake' } },
          { status: { equals: 'published' } },
        ],
      },
      overrideAccess: true,
      limit: 1,
    })
    expect(draft.docs).toHaveLength(0)
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

    expect(own.docs.every((doc) => String(
      typeof doc.tenant === 'object' ? doc.tenant.id : doc.tenant,
    ) === String(auroraId))).toBe(true)

    const crossTenantUpdate = payload.update({
      collection: 'companies',
      id: northernId,
      user: companyAdmin,
      overrideAccess: false,
      data: {
        displayName: 'Should Not Update',
      },
    })

    await expect(crossTenantUpdate).rejects.toThrow()
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

  it('dashboard publish flow: draft -> review -> published becomes publicly visible', async () => {
    const companyAdmin = await payload.findByID({
      collection: 'users',
      id: companyAdminId,
      overrideAccess: true,
    })

    const created = await payload.create({
      collection: 'projects',
      user: companyAdmin,
      data: {
        tenant: Number(auroraId),
        name: 'Test Public Flow',
        slug: `test-public-flow-${Date.now()}`,
        status: 'draft',
        summary: 'Temporary project for dashboard-to-public verification.',
      },
    })

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

    const publicRead = await payload.find({
      collection: 'projects',
      where: {
        and: [
          { tenant: { equals: auroraId } },
          { slug: { equals: created.slug } },
          { status: { equals: 'published' } },
        ],
      },
      overrideAccess: true,
      limit: 1,
    })

    expect(publicRead.docs).toHaveLength(1)

    await payload.delete({
      collection: 'projects',
      id: created.id,
      overrideAccess: true,
    })
  })
})
