import { APIError } from 'payload'

/**
 * Enforces ADR-0004: disclosure-sensitive content cannot skip Review.
 * Allowed transitions into Published: review → published, or already-published updates.
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
