/**
 * Provider-neutral extraction boundary (ADR-0013).
 * Default Sprint 5 adapter is a deterministic fictional fixture with zero network I/O.
 */

import { randomUUID } from 'crypto'

import type { ProvenanceClaim, SourceLocation } from '@/lib/provenance'

export type ExtractionProposal = {
  contentOrigin: 'machine_assisted'
  title: string
  summary: string
  technicalDetails: string
  sourceLocation: SourceLocation
  provenanceClaims: ProvenanceClaim[]
  extractionRunId: string
  extractionProvider: string
  extractionModel: string
  extractionModelVersion: string
  extractedAt: string
}

export type ExtractionAdapter = {
  readonly providerId: string
  extractFromFixture(): Promise<ExtractionProposal>
}

/** Fictional technical report values used by the Sprint 5 error fixture. */
export const FICTIONAL_SOURCE_REPORT = {
  gradeCorrect: '1.20 g/t Au',
  gradeProposedWrong: '12.0 g/t Au',
  holeCorrect: 'AG-24-017',
  holeProposedWrong: 'AG-24-071',
  unitsCorrect: 'g/t',
  unitsProposedWrong: '%',
  page: 7,
  section: '3.2 Drill Results',
} as const

/**
 * Deterministic fixture adapter — proposes known-wrong grade/hole/units from a
 * fictional report so reviewer rejection can be tested. Makes no network calls.
 */
export function createFixtureExtractionAdapter(): ExtractionAdapter {
  return {
    providerId: 'fixture-local',
    async extractFromFixture(): Promise<ExtractionProposal> {
      // Intentionally no fetch / no provider SDK.
      return {
        contentOrigin: 'machine_assisted',
        title: 'North Ridge drill summary (machine proposal)',
        summary: `Proposed intercept ${FICTIONAL_SOURCE_REPORT.gradeProposedWrong} in hole ${FICTIONAL_SOURCE_REPORT.holeProposedWrong}.`,
        technicalDetails: `Units reported as ${FICTIONAL_SOURCE_REPORT.unitsProposedWrong}. Source page ${FICTIONAL_SOURCE_REPORT.page}.`,
        sourceLocation: {
          page: FICTIONAL_SOURCE_REPORT.page,
          section: FICTIONAL_SOURCE_REPORT.section,
          note: 'Fictional Sprint 5 fixture — not a real assay.',
        },
        provenanceClaims: [
          {
            claimId: 'grade',
            field: 'grade',
            proposedValue: FICTIONAL_SOURCE_REPORT.gradeProposedWrong,
            priorValue: FICTIONAL_SOURCE_REPORT.gradeCorrect,
            sourcePage: FICTIONAL_SOURCE_REPORT.page,
            sourceSection: FICTIONAL_SOURCE_REPORT.section,
            unit: FICTIONAL_SOURCE_REPORT.unitsProposedWrong,
          },
          {
            claimId: 'holeId',
            field: 'holeId',
            proposedValue: FICTIONAL_SOURCE_REPORT.holeProposedWrong,
            priorValue: FICTIONAL_SOURCE_REPORT.holeCorrect,
            sourcePage: FICTIONAL_SOURCE_REPORT.page,
            sourceSection: FICTIONAL_SOURCE_REPORT.section,
          },
          {
            claimId: 'units',
            field: 'units',
            proposedValue: FICTIONAL_SOURCE_REPORT.unitsProposedWrong,
            priorValue: FICTIONAL_SOURCE_REPORT.unitsCorrect,
            sourcePage: FICTIONAL_SOURCE_REPORT.page,
            sourceSection: FICTIONAL_SOURCE_REPORT.section,
          },
        ],
        extractionRunId: `fixture-${randomUUID()}`,
        extractionProvider: 'fixture-local',
        extractionModel: 'deterministic-error-fixture',
        extractionModelVersion: 'sprint5-1',
        extractedAt: new Date().toISOString(),
      }
    },
  }
}

/** Default adapter for the application — never calls an external AI provider. */
export function getDefaultExtractionAdapter(): ExtractionAdapter {
  return createFixtureExtractionAdapter()
}
