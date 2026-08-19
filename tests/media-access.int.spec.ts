import { config as loadEnv } from 'dotenv'
import { randomUUID } from 'crypto'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'

describe('media access control (C1)', () => {
  let payload: Payload
  let auroraId: string | number
  let northernId: string | number
  let auroraAdmin: { id: string | number; email: string }
  let northernAdmin: { id: string | number; email: string }
  let northernMembershipId: string | number | null = null
  const created: Array<{ collection: string; id: string | number }> = []

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

    const auroraAdmins = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local' } },
      limit: 1,
      overrideAccess: true,
    })
    auroraAdmin = auroraAdmins.docs[0] as { id: string | number; email: string }

    const northernEmail = `northern-media-admin-${randomUUID().slice(0, 8)}@example.local`
    const northernUser = await payload.create({
      collection: 'users',
      data: {
        email: northernEmail,
        password: 'TestNorthernMedia1!',
        name: 'Northern Media Admin',
        status: 'active',
      },
      overrideAccess: true,
    })
    northernAdmin = northernUser as { id: string | number; email: string }
    created.push({ collection: 'users', id: northernUser.id })

    const membership = await payload.create({
      collection: 'tenant-memberships',
      data: {
        user: northernUser.id,
        tenant: northernId,
        role: 'company_admin',
        status: 'active',
      },
      overrideAccess: true,
    })
    northernMembershipId = membership.id
    created.push({ collection: 'tenant-memberships', id: membership.id })
  })

  afterEach(async () => {
    while (created.length) {
      const item = created.pop()
      if (!item) break
      if (item.collection === 'users' && String(item.id) === String(northernAdmin?.id)) continue
      if (item.collection === 'tenant-memberships' && String(item.id) === String(northernMembershipId)) {
        continue
      }
      try {
        await payload.delete({
          collection: item.collection as 'media',
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // already removed
      }
    }
  })

  async function createMedia(args: {
    tenantId: string | number
    user: { id: string | number }
    originalName: string
    contents?: string
  }) {
    const buffer = Buffer.from(args.contents || 'draft confidential contents')
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: args.originalName,
        tenant: args.tenantId as number,
      },
      file: {
        data: buffer,
        mimetype: 'application/pdf',
        name: args.originalName,
        size: buffer.length,
      },
      user: args.user,
      overrideAccess: false,
    })
    created.push({ collection: 'media', id: media.id })
    return media
  }

  async function createDocument(args: {
    tenantId: string | number
    user: { id: string | number }
    fileId: string | number
    status: 'draft' | 'review' | 'published'
    slug: string
  }) {
    const doc = await payload.create({
      collection: 'documents',
      data: {
        tenant: args.tenantId as number,
        title: `Media access ${args.slug}`,
        slug: args.slug,
        category: 'technical_report',
        publicationDate: '2026-08-12',
        file: args.fileId as number,
        sourceUrl: 'https://example.com/media-access-source',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      user: args.user,
      overrideAccess: false,
    })
    created.push({ collection: 'documents', id: doc.id })

    if (args.status === 'review' || args.status === 'published') {
      await payload.update({
        collection: 'documents',
        id: doc.id,
        data: { status: 'review' },
        user: args.user,
        overrideAccess: false,
      })
    }
    if (args.status === 'published') {
      await payload.update({
        collection: 'documents',
        id: doc.id,
        data: { status: 'published' },
        user: args.user,
        overrideAccess: false,
      })
    }

    return doc
  }

  it('denies anonymous read of media attached to a REVIEW document', async () => {
    const media = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName: 'review-only-technical-memo.pdf',
    })
    await createDocument({
      tenantId: auroraId,
      user: auroraAdmin,
      fileId: media.id,
      status: 'review',
      slug: `media-review-${randomUUID().slice(0, 8)}`,
    })

    const anon = await payload.find({
      collection: 'media',
      where: { id: { equals: media.id } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    expect(anon.docs).toHaveLength(0)
  })

  it('denies anonymous read of media attached to a DRAFT document', async () => {
    const media = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName: 'ni-43-101-technical-report.pdf',
    })
    await createDocument({
      tenantId: auroraId,
      user: auroraAdmin,
      fileId: media.id,
      status: 'draft',
      slug: `media-draft-${randomUUID().slice(0, 8)}`,
    })

    const anon = await payload.find({
      collection: 'media',
      where: { id: { equals: media.id } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    expect(anon.docs).toHaveLength(0)

    await expect(
      payload.findByID({
        collection: 'media',
        id: media.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('allows anonymous read of media attached to a PUBLISHED document', async () => {
    const media = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName: 'published-investor-deck.pdf',
    })
    await createDocument({
      tenantId: auroraId,
      user: auroraAdmin,
      fileId: media.id,
      status: 'published',
      slug: `media-published-${randomUUID().slice(0, 8)}`,
    })

    const anon = await payload.find({
      collection: 'media',
      where: { id: { equals: media.id } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    expect(anon.docs).toHaveLength(1)
    expect(anon.docs[0].id).toBe(media.id)
    expect(String(anon.docs[0].url || '')).not.toMatch(/storage\.supabase\.co\/storage\/v1\/object\/public/)
  })

  it('denies another tenant Company Admin from reading Aurora media (draft or published)', async () => {
    const draftMedia = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName: 'aurora-draft-only.pdf',
    })
    await createDocument({
      tenantId: auroraId,
      user: auroraAdmin,
      fileId: draftMedia.id,
      status: 'draft',
      slug: `media-xtenant-draft-${randomUUID().slice(0, 8)}`,
    })

    const publishedMedia = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName: 'aurora-published-only.pdf',
    })
    await createDocument({
      tenantId: auroraId,
      user: auroraAdmin,
      fileId: publishedMedia.id,
      status: 'published',
      slug: `media-xtenant-published-${randomUUID().slice(0, 8)}`,
    })

    const northernRead = await payload.find({
      collection: 'media',
      where: {
        id: {
          in: [draftMedia.id, publishedMedia.id],
        },
      },
      limit: 10,
      depth: 0,
      user: northernAdmin,
      overrideAccess: false,
    })
    expect(northernRead.docs).toHaveLength(0)
  })

  it('stores randomized object keys while retaining the original display name', async () => {
    const originalName = 'ni-43-101-technical-report.pdf'
    const media = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName,
    })

    expect(media.filename).toBeTruthy()
    expect(media.filename).not.toBe(originalName)
    expect(String(media.filename)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-ni-43-101-technical-report\.pdf$/i,
    )
    expect(media.originalFilename || media.alt).toBe(originalName)
    expect(String(media.url || '')).not.toMatch(/storage\.supabase\.co/)
  })

  it('sanitizes spaces and unicode in object keys while keeping display name', async () => {
    const originalName = 'Dario Amodei — Machines of Loving Grace.pdf'
    const media = await createMedia({
      tenantId: auroraId,
      user: auroraAdmin,
      originalName,
    })

    expect(String(media.filename)).toMatch(
      /^[0-9a-f-]{36}-Dario-Amodei-Machines-of-Loving-Grace\.pdf$/i,
    )
    expect(String(media.filename)).not.toMatch(/\s|—/)
    expect(media.originalFilename || media.alt).toBe(originalName)
  })

  it('denies anonymous read of seeded draft uploaded memo media when present', async () => {
    const draftDoc = await payload.find({
      collection: 'documents',
      where: {
        and: [
          { tenant: { equals: auroraId } },
          { slug: { equals: 'draft-technical-memo-upload' } },
          { status: { equals: 'draft' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    expect(draftDoc.docs[0], 'Run `npm run seed` to create the M5 uploaded-document fixture').toBeTruthy()
    const fileId =
      typeof draftDoc.docs[0].file === 'object' && draftDoc.docs[0].file && 'id' in draftDoc.docs[0].file
        ? draftDoc.docs[0].file.id
        : draftDoc.docs[0].file
    expect(fileId).toBeTruthy()

    const anon = await payload.find({
      collection: 'media',
      where: { id: { equals: fileId as string | number } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    expect(anon.docs).toHaveLength(0)
  })
})
