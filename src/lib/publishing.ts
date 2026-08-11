import { APIError } from 'payload'

export const PROJECT_DISCLOSURE_FIELDS = [
  'technicalSummary',
  'highlights',
  'summary',
  'ownershipPercent',
  'sourceLinks',
] as const

export const COMPANY_DISCLOSURE_FIELDS = ['investmentThesis', 'longDescription'] as const

/**
 * Enforces ADR-0004: disclosure-sensitive content cannot skip Review.
 * Allowed transitions into Published: review → published only (not draft/archived).
 */
export function assertPublicationTransition(args: {
  incomingStatus?: string | null
  previousStatus?: string | null
}): void {
  const { incomingStatus, previousStatus } = args

  if (!incomingStatus || incomingStatus !== 'published') {
    return
  }

  if (!previousStatus || previousStatus === 'draft' || previousStatus === 'archived') {
    throw new APIError(
      'Technical disclosure cannot move directly to Published. Submit for Review, then approve.',
      400,
    )
  }

  if (previousStatus !== 'review' && previousStatus !== 'published') {
    throw new APIError('Invalid publication transition.', 400)
  }
}

function normalizeComparable(value: unknown): unknown {
  if (value === undefined) return null
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (entry && typeof entry === 'object') {
        const copy = { ...(entry as Record<string, unknown>) }
        delete copy.id
        return normalizeComparable(copy)
      }
      return normalizeComparable(entry)
    })
  }
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (key === 'id') continue
      sorted[key] = normalizeComparable((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeComparable(a)) === JSON.stringify(normalizeComparable(b))
}

export function disclosureFieldsChanged(
  fields: readonly string[],
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown> | null,
): boolean {
  if (!originalDoc) return false

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue
    if (!valuesEqual(data[field], originalDoc[field])) {
      return true
    }
  }

  return false
}

/**
 * Published disclosure content cannot be rewritten in place.
 * review → published must be a status-only mutation (no disclosure field edits).
 */
export function assertDisclosureWriteAllowed(args: {
  fields: readonly string[]
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  previousStatus?: string | null
  incomingStatus?: string | null
}): void {
  const { fields, data, originalDoc, previousStatus, incomingStatus } = args
  const changed = disclosureFieldsChanged(fields, data, originalDoc)
  if (!changed) return

  if (previousStatus === 'published' && (incomingStatus === 'published' || !incomingStatus)) {
    throw new APIError(
      'Published disclosure fields cannot be edited in place. Move the record back to Review, edit, then approve again.',
      400,
    )
  }

  if (previousStatus === 'review' && incomingStatus === 'published') {
    throw new APIError(
      'Approval must be a status-only action. Save disclosure content while in Review, then approve separately.',
      400,
    )
  }
}

export function applyReviewMetadata<T extends Record<string, unknown>>(args: {
  data: T
  incomingStatus?: string | null
  previousStatus?: string | null
  reviewerId?: string | number | null
}): T {
  const { data, incomingStatus, previousStatus, reviewerId } = args

  if (incomingStatus === 'published' && previousStatus === 'review') {
    return {
      ...data,
      reviewedBy: reviewerId ?? undefined,
      reviewedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }
  }

  return data
}

export function guardCreateNotPublished(status: string | null | undefined): void {
  if (status === 'published') {
    throw new APIError(
      'New records cannot be created as Published. Start in Draft, then submit for Review.',
      400,
    )
  }
}

export function isPublishedStatus(status: string | null | undefined): boolean {
  return status === 'published'
}
