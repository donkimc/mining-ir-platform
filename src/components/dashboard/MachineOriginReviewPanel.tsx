'use client'

import type { ProvenanceClaim, SourceLocation } from '@/lib/provenance'

type Props = {
  contentOrigin?: string | null
  sourceLocation?: SourceLocation | null
  provenanceClaims?: ProvenanceClaim[] | null
  sourceDocumentId?: string | null
  sourceDocumentTitle?: string | null
  fileUrl?: string | null
  extractionProvider?: string | null
}

export function MachineOriginReviewPanel({
  contentOrigin,
  sourceLocation,
  provenanceClaims,
  sourceDocumentId,
  sourceDocumentTitle,
  fileUrl,
  extractionProvider,
}: Props) {
  if (contentOrigin !== 'machine_assisted') return null

  const claims = Array.isArray(provenanceClaims) ? provenanceClaims : []

  return (
    <section
      className="panel space-y-4 border-[color-mix(in_oklab,var(--accent)_35%,transparent)]"
      aria-labelledby="machine-origin-heading"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="machine-origin-heading" className="display text-2xl">
          Reviewer source context
        </h2>
        <span className="rounded border border-[var(--ink)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
          Machine-assisted
        </span>
      </div>
      <p className="text-sm text-[var(--ink-soft)]">
        This draft includes machine-proposed values. Verify against the source document before
        approval. Model confidence is not approval evidence.
      </p>
      {extractionProvider ? (
        <p className="text-xs text-[var(--ink-soft)]">Extraction provider: {extractionProvider}</p>
      ) : null}

      <div className="space-y-1 text-sm">
        {sourceDocumentId ? (
          <p>
            <span className="font-medium text-[var(--ink)]">Source document: </span>
            {sourceDocumentTitle || `Document #${sourceDocumentId}`}
            {fileUrl ? (
              <>
                {' '}
                —{' '}
                <a href={fileUrl} className="underline">
                  Open file
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p role="status">No source document linked.</p>
        )}
        {sourceLocation ? (
          <p>
            <span className="font-medium text-[var(--ink)]">Source location: </span>
            {[
              sourceLocation.page != null ? `page ${sourceLocation.page}` : null,
              sourceLocation.section,
              sourceLocation.anchor,
            ]
              .filter(Boolean)
              .join(' · ') || 'See provenance claims'}
          </p>
        ) : null}
      </div>

      {claims.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Proposed vs source values</caption>
            <thead>
              <tr className="border-b border-[color-mix(in_oklab,var(--ink)_14%,transparent)]">
                <th className="py-2 pr-3 font-semibold">Claim</th>
                <th className="py-2 pr-3 font-semibold">Source / prior</th>
                <th className="py-2 pr-3 font-semibold">Proposed</th>
                <th className="py-2 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr
                  key={claim.claimId}
                  className="border-b border-[color-mix(in_oklab,var(--ink)_8%,transparent)]"
                >
                  <td className="py-2 pr-3">{claim.field || claim.claimId}</td>
                  <td className="py-2 pr-3">{claim.priorValue ?? '—'}</td>
                  <td className="py-2 pr-3 font-medium">{claim.proposedValue}</td>
                  <td className="py-2">
                    {[
                      claim.sourcePage != null ? `p.${claim.sourcePage}` : null,
                      claim.sourceSection,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
