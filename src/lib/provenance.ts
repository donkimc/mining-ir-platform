import { APIError } from 'payload'

import { PROVENANCE_FIELD_NAMES } from '@/lib/provenance-fields'

export type ContentOrigin = 'human_authored' | 'machine_assisted'

export type SourceLocation = {
  page?: number
  section?: string
  anchor?: string
  note?: string
}

export type ProvenanceClaim = {
  claimId: string
  field?: string
  proposedValue: string
  priorValue?: string | null
  sourcePage?: number
  sourceSection?: string
  unit?: string
}

/** Drop client-supplied provenance / origin / extraction / source-check fields. */
export function stripForgedProvenanceMetadata<T extends Record<string, unknown>>(data: T): T {
  const next = { ...data }
  for (const key of PROVENANCE_FIELD_NAMES) {
    delete next[key]
  }
  return next
}

/**
 * Restore server-owned provenance from the existing document after stripping client forgeries.
 * Also blocks downgrading machine_assisted → human_authored.
 */
export function restoreProvenanceFromOriginal<T extends Record<string, unknown>>(args: {
  data: T
  originalDoc?: Record<string, unknown> | null
  /** Server-only path may set these explicitly (extraction / approval). */
  serverProvenance?: Partial<Record<(typeof PROVENANCE_FIELD_NAMES)[number], unknown>>
}): T {
  const { data, originalDoc, serverProvenance } = args
  const next = { ...data } as Record<string, unknown>

  for (const key of PROVENANCE_FIELD_NAMES) {
    if (originalDoc && Object.prototype.hasOwnProperty.call(originalDoc, key)) {
      next[key] = originalDoc[key]
    }
  }

  if (!next.contentOrigin) {
    next.contentOrigin = 'human_authored'
  }

  if (serverProvenance) {
    for (const [key, value] of Object.entries(serverProvenance)) {
      if (value !== undefined) next[key] = value
    }
  }

  const previousOrigin = (originalDoc?.contentOrigin as ContentOrigin | undefined) ?? 'human_authored'
  if (previousOrigin === 'machine_assisted' && next.contentOrigin !== 'machine_assisted') {
    throw new APIError(
      'Machine-assisted origin cannot be downgraded to human-authored.',
      400,
    )
  }

  return next as T
}

/** Machine-assisted Review → Published requires explicit source acknowledgement. */
export function assertMachineAssistedSourceCheck(args: {
  originalDoc?: Record<string, unknown> | null
  incomingStatus?: string | null
  previousStatus?: string | null
  sourceCheckAcknowledged?: boolean
}): void {
  const { originalDoc, incomingStatus, previousStatus, sourceCheckAcknowledged } = args
  if (incomingStatus !== 'published' || previousStatus !== 'review') return
  if ((originalDoc?.contentOrigin as string | undefined) !== 'machine_assisted') return

  if (!sourceCheckAcknowledged) {
    throw new APIError(
      'Machine-assisted content requires source-verification acknowledgement before approval.',
      400,
    )
  }
}

export function applySourceCheckMetadata<T extends Record<string, unknown>>(args: {
  data: T
  incomingStatus?: string | null
  previousStatus?: string | null
  reviewerId?: string | number | null
  originalDoc?: Record<string, unknown> | null
  sourceCheckAcknowledged?: boolean
}): T {
  const {
    data,
    incomingStatus,
    previousStatus,
    reviewerId,
    originalDoc,
    sourceCheckAcknowledged,
  } = args

  if (incomingStatus !== 'published' || previousStatus !== 'review') return data
  if ((originalDoc?.contentOrigin as string | undefined) !== 'machine_assisted') return data
  if (!sourceCheckAcknowledged) return data

  return {
    ...data,
    reviewerSourceCheckBy: reviewerId ?? undefined,
    reviewerSourceCheckAt: new Date().toISOString(),
  }
}

/** Machine-assisted records cannot be created already published (defense in depth). */
export function guardCreateNotMachinePublished(args: {
  status?: string | null
  contentOrigin?: string | null
}): void {
  if (args.contentOrigin === 'machine_assisted' && args.status === 'published') {
    throw new APIError(
      'Machine-assisted content cannot be created as Published. Start in Draft and use human approval.',
      400,
    )
  }
}
