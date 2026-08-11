import { describe, expect, it } from 'vitest'

import {
  assertDisclosureWriteAllowed,
  assertPublicationTransition,
  guardCreateNotPublished,
  isPublishedStatus,
  PROJECT_DISCLOSURE_FIELDS,
} from '@/lib/publishing'
import { shouldAcceptTenantSlugHeader } from '@/lib/tenant'

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

  it('rejects published disclosure field edits', () => {
    expect(() =>
      assertDisclosureWriteAllowed({
        fields: PROJECT_DISCLOSURE_FIELDS,
        data: { technicalSummary: 'new claim' },
        originalDoc: { technicalSummary: 'old claim' },
        previousStatus: 'published',
        incomingStatus: 'published',
      }),
    ).toThrow(/Published disclosure fields cannot be edited/i)
  })

  it('rejects review-to-published when disclosure fields also change', () => {
    expect(() =>
      assertDisclosureWriteAllowed({
        fields: PROJECT_DISCLOSURE_FIELDS,
        data: { status: 'published', technicalSummary: 'new claim' },
        originalDoc: { technicalSummary: 'old claim' },
        previousStatus: 'review',
        incomingStatus: 'published',
      }),
    ).toThrow(/status-only/i)
  })

  it('allows non-disclosure edits while published', () => {
    expect(() =>
      assertDisclosureWriteAllowed({
        fields: PROJECT_DISCLOSURE_FIELDS,
        data: { name: 'Renamed' },
        originalDoc: { name: 'Old', technicalSummary: 'same' },
        previousStatus: 'published',
        incomingStatus: 'published',
      }),
    ).not.toThrow()
  })
})

describe('tenant slug header gate (H1)', () => {
  it('accepts header in non-production', () => {
    expect(
      shouldAcceptTenantSlugHeader({
        nodeEnv: 'development',
        hasHeader: true,
        trustedProxy: false,
      }),
    ).toBe(true)
  })

  it('rejects header in production without trusted proxy', () => {
    expect(
      shouldAcceptTenantSlugHeader({
        nodeEnv: 'production',
        hasHeader: true,
        trustedProxy: false,
      }),
    ).toBe(false)
  })

  it('accepts header in production with trusted proxy secret', () => {
    expect(
      shouldAcceptTenantSlugHeader({
        nodeEnv: 'production',
        hasHeader: true,
        trustedProxy: true,
      }),
    ).toBe(true)
  })
})
