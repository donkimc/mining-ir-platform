import { describe, expect, it, vi } from 'vitest'

import {
  createFixtureExtractionAdapter,
  FICTIONAL_SOURCE_REPORT,
  getDefaultExtractionAdapter,
} from '@/lib/extraction/adapter'
import { assertAllowedIngestionFile, INGESTION_MAX_BYTES } from '@/lib/ingestion'
import {
  applySourceCheckMetadata,
  assertMachineAssistedSourceCheck,
  guardCreateNotMachinePublished,
  restoreProvenanceFromOriginal,
  stripForgedProvenanceMetadata,
} from '@/lib/provenance'
import { serializeAnonymousPublicDoc } from '@/lib/collection-hooks'

describe('provenance (ADR-0012)', () => {
  it('strips forged provenance fields from client input', () => {
    const stripped = stripForgedProvenanceMetadata({
      title: 'ok',
      contentOrigin: 'human_authored',
      extractionRunId: 'forged',
      reviewedBy: 1,
    })
    expect(stripped.title).toBe('ok')
    expect(stripped.contentOrigin).toBeUndefined()
    expect(stripped.extractionRunId).toBeUndefined()
  })

  it('restores original machine origin and rejects downgrade', () => {
    const restored = restoreProvenanceFromOriginal({
      data: { title: 'x', contentOrigin: 'human_authored' } as Record<string, unknown>,
      originalDoc: {
        contentOrigin: 'machine_assisted',
        extractionRunId: 'run-1',
      },
    })
    expect(restored.contentOrigin).toBe('machine_assisted')
    expect(restored.extractionRunId).toBe('run-1')

    expect(() =>
      restoreProvenanceFromOriginal({
        data: { contentOrigin: 'human_authored' },
        originalDoc: { contentOrigin: 'machine_assisted' },
        serverProvenance: { contentOrigin: 'human_authored' },
      }),
    ).toThrow(/cannot be downgraded/i)
  })

  it('requires source acknowledgement for machine-assisted approval', () => {
    expect(() =>
      assertMachineAssistedSourceCheck({
        originalDoc: { contentOrigin: 'machine_assisted' },
        previousStatus: 'review',
        incomingStatus: 'published',
        sourceCheckAcknowledged: false,
      }),
    ).toThrow(/source-verification acknowledgement/i)

    expect(() =>
      assertMachineAssistedSourceCheck({
        originalDoc: { contentOrigin: 'machine_assisted' },
        previousStatus: 'review',
        incomingStatus: 'published',
        sourceCheckAcknowledged: true,
      }),
    ).not.toThrow()
  })

  it('stamps source-check metadata on acknowledged approval', () => {
    const next = applySourceCheckMetadata({
      data: { status: 'published' } as Record<string, unknown>,
      previousStatus: 'review',
      incomingStatus: 'published',
      originalDoc: { contentOrigin: 'machine_assisted' },
      reviewerId: 42,
      sourceCheckAcknowledged: true,
    })
    expect(next.reviewerSourceCheckBy).toBe(42)
    expect(typeof next.reviewerSourceCheckAt).toBe('string')
  })

  it('blocks creating machine-assisted content as published', () => {
    expect(() =>
      guardCreateNotMachinePublished({ status: 'published', contentOrigin: 'machine_assisted' }),
    ).toThrow(/cannot be created as Published/i)
  })

  it('omits provenance from anonymous serialization', () => {
    const publicDoc = serializeAnonymousPublicDoc({
      title: 'Public',
      contentOrigin: 'machine_assisted',
      provenanceClaims: [{ claimId: 'x', proposedValue: '12.0' }],
      extractionRunId: 'secret',
      reviewerSourceCheckBy: 1,
      reviewedBy: 2,
      tenant: 9,
    })
    expect(publicDoc.title).toBe('Public')
    expect(publicDoc.contentOrigin).toBeUndefined()
    expect(publicDoc.provenanceClaims).toBeUndefined()
    expect(publicDoc.extractionRunId).toBeUndefined()
    expect(publicDoc.reviewerSourceCheckBy).toBeUndefined()
    expect(publicDoc.reviewedBy).toBeUndefined()
    expect(publicDoc.tenant).toBeUndefined()
  })
})

describe('ingestion limits (ADR-0014)', () => {
  it('accepts PDF under size limit', () => {
    expect(() =>
      assertAllowedIngestionFile({
        mimeType: 'application/pdf',
        filename: 'report.pdf',
        sizeBytes: 1024,
      }),
    ).not.toThrow()
  })

  it('rejects non-PDF and oversized files', () => {
    expect(() =>
      assertAllowedIngestionFile({ mimeType: 'text/plain', filename: 'x.txt', sizeBytes: 10 }),
    ).toThrow(/Only PDF/i)
    expect(() =>
      assertAllowedIngestionFile({
        mimeType: 'application/pdf',
        filename: 'big.pdf',
        sizeBytes: INGESTION_MAX_BYTES + 1,
      }),
    ).toThrow(/10 MiB/i)
  })
})

describe('extraction adapter (ADR-0013)', () => {
  it('default fixture proposes known-wrong grade/hole/units without network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const proposal = await getDefaultExtractionAdapter().extractFromFixture()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()

    expect(proposal.contentOrigin).toBe('machine_assisted')
    expect(proposal.extractionProvider).toBe('fixture-local')
    const byId = Object.fromEntries(proposal.provenanceClaims.map((c) => [c.claimId, c]))
    expect(byId.grade.proposedValue).toBe(FICTIONAL_SOURCE_REPORT.gradeProposedWrong)
    expect(byId.grade.priorValue).toBe(FICTIONAL_SOURCE_REPORT.gradeCorrect)
    expect(byId.holeId.proposedValue).toBe(FICTIONAL_SOURCE_REPORT.holeProposedWrong)
    expect(byId.units.proposedValue).toBe(FICTIONAL_SOURCE_REPORT.unitsProposedWrong)
  })

  it('fixture adapter id is local-only', () => {
    expect(createFixtureExtractionAdapter().providerId).toBe('fixture-local')
  })
})
