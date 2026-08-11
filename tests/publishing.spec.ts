import { describe, expect, it } from 'vitest'

import {
  assertPublicationTransition,
  guardCreateNotPublished,
  isPublishedStatus,
} from '@/lib/publishing'

describe('publication review gate', () => {
  it('rejects draft to published', () => {
    expect(() =>
      assertPublicationTransition({
        incomingStatus: 'published',
        previousStatus: 'draft',
      }),
    ).toThrow(/cannot move directly to Published/i)
  })

  it('rejects archived to published', () => {
    expect(() =>
      assertPublicationTransition({
        incomingStatus: 'published',
        previousStatus: 'archived',
      }),
    ).toThrow(/cannot move directly to Published/i)
  })

  it('allows review to published', () => {
    expect(() =>
      assertPublicationTransition({
        incomingStatus: 'published',
        previousStatus: 'review',
      }),
    ).not.toThrow()
  })

  it('allows published to remain published', () => {
    expect(() =>
      assertPublicationTransition({
        incomingStatus: 'published',
        previousStatus: 'published',
      }),
    ).not.toThrow()
  })

  it('rejects creating records as published', () => {
    expect(() => guardCreateNotPublished('published')).toThrow(/cannot be created as Published/i)
  })

  it('identifies published status only', () => {
    expect(isPublishedStatus('published')).toBe(true)
    expect(isPublishedStatus('draft')).toBe(false)
    expect(isPublishedStatus('review')).toBe(false)
  })
})
