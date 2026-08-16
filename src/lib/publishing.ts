import { APIError, type Payload } from 'payload'

export const PROJECT_DISCLOSURE_FIELDS = [
  'technicalSummary',
  'highlights',
  'summary',
  'ownershipPercent',
  'sourceLinks',
] as const

export const COMPANY_DISCLOSURE_FIELDS = ['investmentThesis', 'longDescription'] as const

export const NEWS_DISCLOSURE_FIELDS = [
  'title',
  'excerpt',
  'body',
  'sourceUrl',
  'sourceDocument',
  'project',
  'releaseDate',
  'disclosureLevel',
] as const

export const DOCUMENT_DISCLOSURE_FIELDS = [
  'title',
  'category',
  'publicationDate',
  'externalUrl',
  'file',
  'project',
  'sourceUrl',
  'sourceDocument',
  'disclosureLevel',
] as const

export const PERSON_DISCLOSURE_FIELDS = [
  'name',
  'roleTitle',
  'group',
  'biography',
  'headshot',
  'disclosureLevel',
] as const

export const SHARE_DISCLOSURE_FIELDS = [
  'asOfDate',
  'sharesOutstanding',
  'options',
  'warrants',
  'fullyDiluted',
  'marketCapNote',
  'sourceUrl',
  'sourceDocument',
  'disclosureLevel',
] as const

export const EXPLORATION_DISCLOSURE_FIELDS = [
  'project',
  'title',
  'contentDate',
  'summary',
  'technicalDetails',
  'sourceUrl',
  'sourceDocument',
  'disclosureLevel',
] as const

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

/** Drop client-supplied review audit fields; only server approval may set them. */
export function stripForgedReviewMetadata<T extends Record<string, unknown>>(data: T): T {
  const next = { ...data }
  delete next.reviewedBy
  delete next.reviewedAt
  delete next.publishedAt
  return next
}

export function relationId(value: unknown): string | number | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: string | number }).id
  }
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

function hasSourceReference(data: Record<string, unknown>, originalDoc?: Record<string, unknown> | null): boolean {
  const sourceUrl = data.sourceUrl ?? originalDoc?.sourceUrl
  const externalUrl = data.externalUrl ?? originalDoc?.externalUrl
  const sourceDocument = relationId(data.sourceDocument ?? originalDoc?.sourceDocument)
  const file = relationId(data.file ?? originalDoc?.file)
  return Boolean(
    (typeof sourceUrl === 'string' && sourceUrl.trim()) ||
      (typeof externalUrl === 'string' && externalUrl.trim()) ||
      sourceDocument != null ||
      file != null,
  )
}

/**
 * Material mining claims require a source URL or source document before Review/Published.
 * Required when the collection default says so, or when disclosureLevel is technical.
 */
export function shouldRequireSource(args: {
  collectionDefault?: boolean
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
}): boolean {
  const level = args.data.disclosureLevel ?? args.originalDoc?.disclosureLevel
  if (level === 'technical') return true
  return Boolean(args.collectionDefault)
}

export function assertSourceReferenceRequired(args: {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  incomingStatus?: string | null
  required?: boolean
}): void {
  const { data, originalDoc, incomingStatus, required = true } = args
  if (!required) return
  if (incomingStatus !== 'review' && incomingStatus !== 'published') return

  if (!hasSourceReference(data, originalDoc)) {
    throw new APIError(
      'A source URL or source document is required before Review or Published for material content.',
      400,
    )
  }
}

export async function assertSameTenantRelation(args: {
  payload: Payload
  tenantId: string | number
  collection: 'projects' | 'documents' | 'media'
  id: string | number | null | undefined
  label: string
}): Promise<void> {
  const { payload, tenantId, collection, id, label } = args
  if (id == null) return

  try {
    const doc = await payload.findByID({
      collection,
      id,
      depth: 0,
      overrideAccess: true,
      // Retain tenant IDs for server-side relation checks (public serializer strips them for anon).
      context: { skipPublicSerializer: true },
    })

    const docTenant = relationId((doc as { tenant?: unknown }).tenant)
    if (String(docTenant) !== String(tenantId)) {
      throw new APIError(`${label} must belong to the same tenant.`, 400)
    }
  } catch (error) {
    // N3: Payload NotFound extends APIError — only rethrow intentional 400 validation errors.
    if (error instanceof APIError && error.status === 400) throw error
    throw new APIError(`${label} must belong to the same tenant.`, 400)
  }
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
