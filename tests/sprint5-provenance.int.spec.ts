import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import path from 'path'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload, type PayloadRequest } from 'payload'

import config from '@payload-config'
import { publishedReferencedMediaWhere } from '@/collections/Media'
import { getDefaultExtractionAdapter } from '@/lib/extraction/adapter'

describe('sprint5 provenance + media authorization', () => {
  let payload: Payload
  let auroraId: string | number
  let auroraAdmin: { id: string | number }
  const created: Array<{ collection: string; id: string | number }> = []

  beforeAll(async () => {
    payload = await getPayload({ config })
    const aurora = await payload.find({
      collection: 'companies',
      where: { slug: { equals: 'aurora-gold' } },
      limit: 1,
      overrideAccess: true,
    })
    if (!aurora.docs[0]) throw new Error('Seed Aurora missing')
    auroraId = aurora.docs[0].id
    const admins = await payload.find({
      collection: 'users',
      where: { email: { equals: process.env.SEED_COMPANY_ADMIN_EMAIL || 'admin@auroragold.local' } },
      limit: 1,
      overrideAccess: true,
    })
    auroraAdmin = admins.docs[0] as { id: string | number }
  })

  afterEach(async () => {
    while (created.length) {
      const item = created.pop()
      if (!item) break
      try {
        await payload.delete({
          collection: item.collection as 'media',
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // ignore
      }
    }
  })

  it('S4-3 source has no silent limit: 1000 hard-cap', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/collections/Media.ts'), 'utf8')
    expect(src).not.toMatch(/limit:\s*1000/)
  })

  it('rejects forged provenance on update and preserves machine origin', async () => {
    const proposal = await getDefaultExtractionAdapter().extractFromFixture()
    const project = await payload.find({
      collection: 'projects',
      where: {
        and: [{ tenant: { equals: auroraId } }, { status: { equals: 'published' } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!project.docs[0]) throw new Error('Need a published Aurora project')

    const createdDoc = await payload.create({
      collection: 'exploration-contents',
      overrideAccess: true,
      data: {
        tenant: auroraId as number,
        project: project.docs[0].id as number,
        title: proposal.title,
        contentDate: '2026-01-15',
        summary: proposal.summary,
        technicalDetails: proposal.technicalDetails,
        sourceUrl: 'https://example.invalid/fictional-report',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      context: {
        skipPublicSerializer: true,
        serverProvenance: {
          contentOrigin: 'machine_assisted',
          originLockedAt: new Date().toISOString(),
          sourceLocation: proposal.sourceLocation,
          provenanceClaims: proposal.provenanceClaims,
          extractionRunId: proposal.extractionRunId,
          extractionProvider: proposal.extractionProvider,
          extractionModel: proposal.extractionModel,
          extractionModelVersion: proposal.extractionModelVersion,
          extractedAt: proposal.extractedAt,
        },
      },
    })
    created.push({ collection: 'exploration-contents', id: createdDoc.id })

    expect(createdDoc.contentOrigin).toBe('machine_assisted')

    const forged = await payload.update({
      collection: 'exploration-contents',
      id: createdDoc.id,
      user: auroraAdmin as never,
      overrideAccess: false,
      data: {
        contentOrigin: 'human_authored',
        extractionRunId: 'forged-run',
        summary: `${createdDoc.summary} edited`,
      },
    })
    expect(forged.contentOrigin).toBe('machine_assisted')
    expect(forged.extractionRunId).toBe(proposal.extractionRunId)

    await payload.update({
      collection: 'exploration-contents',
      id: createdDoc.id,
      overrideAccess: true,
      data: { status: 'review' },
    })

    await expect(
      payload.update({
        collection: 'exploration-contents',
        id: createdDoc.id,
        user: auroraAdmin as never,
        overrideAccess: false,
        data: { status: 'published' },
        context: { skipPublicSerializer: true, sourceCheckAcknowledged: false },
      }),
    ).rejects.toThrow(/source-verification acknowledgement|Machine-assisted/i)

    const approved = await payload.update({
      collection: 'exploration-contents',
      id: createdDoc.id,
      user: auroraAdmin as never,
      overrideAccess: false,
      data: { status: 'published' },
      context: { skipPublicSerializer: true, sourceCheckAcknowledged: true },
    })
    expect(approved.status).toBe('published')
    expect(approved.reviewerSourceCheckBy).toBeTruthy()
    expect(approved.reviewedBy).toBeTruthy()

    const rejected = await payload.create({
      collection: 'exploration-contents',
      overrideAccess: true,
      data: {
        tenant: auroraId as number,
        project: project.docs[0].id as number,
        title: `Rejected ${randomUUID().slice(0, 8)}`,
        contentDate: '2026-01-16',
        summary: proposal.summary,
        technicalDetails: proposal.technicalDetails,
        sourceUrl: 'https://example.invalid/fictional-report',
        disclosureLevel: 'technical',
        status: 'draft',
      },
      context: {
        skipPublicSerializer: true,
        serverProvenance: {
          contentOrigin: 'machine_assisted',
          originLockedAt: new Date().toISOString(),
          sourceLocation: proposal.sourceLocation,
          provenanceClaims: proposal.provenanceClaims,
          extractionRunId: `reject-${proposal.extractionRunId}`,
          extractionProvider: proposal.extractionProvider,
          extractionModel: proposal.extractionModel,
          extractionModelVersion: proposal.extractionModelVersion,
          extractedAt: proposal.extractedAt,
        },
      },
    })
    created.push({ collection: 'exploration-contents', id: rejected.id })
    await payload.update({
      collection: 'exploration-contents',
      id: rejected.id,
      overrideAccess: true,
      data: { status: 'review' },
    })
    await payload.update({
      collection: 'exploration-contents',
      id: rejected.id,
      user: auroraAdmin as never,
      overrideAccess: false,
      data: { status: 'draft' },
    })

    const publicList = await payload.find({
      collection: 'exploration-contents',
      where: {
        and: [{ tenant: { equals: auroraId } }, { status: { equals: 'published' } }],
      },
      overrideAccess: true,
      limit: 100,
    })
    expect(publicList.docs.some((d) => d.id === rejected.id)).toBe(false)
  })

  it('includes referenced media beyond the former 1000-ID materialization cap (S4-3)', async () => {
    const total = 1005
    const allIds = Array.from({ length: total }, (_, i) => String(50_000 + i))
    let peoplePages = 0

    const fakePayload = {
      find: async (args: {
        collection: string
        page?: number
        limit?: number
      }) => {
        if (args.collection === 'documents') {
          return { docs: [], hasNextPage: false }
        }
        const page = args.page ?? 1
        const limit = args.limit ?? 100
        peoplePages += 1
        const start = (page - 1) * limit
        const slice = allIds.slice(start, start + limit)
        return {
          docs: slice.map((id) => ({ headshot: id })),
          hasNextPage: start + limit < allIds.length,
        }
      },
    }

    const where = await publishedReferencedMediaWhere(
      { payload: fakePayload, user: undefined } as unknown as PayloadRequest,
      { pageSize: 100 },
    )
    const ids = (where as { id?: { in?: string[] } }).id?.in || []
    expect(peoplePages).toBeGreaterThan(10)
    expect(ids.length).toBe(total)
    expect(ids).toContain(allIds[allIds.length - 1])
  })
})
