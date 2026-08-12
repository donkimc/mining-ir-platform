import { describe, expect, it } from 'vitest'

import {
  assertDisclosureWriteAllowed,
  assertPublicationTransition,
  assertSourceReferenceRequired,
  guardCreateNotPublished,
  isPublishedStatus,
  PERSON_DISCLOSURE_FIELDS,
  PROJECT_DISCLOSURE_FIELDS,
  shouldRequireSource,
  stripForgedReviewMetadata,
} from '@/lib/publishing'
import { isPlatformDeploymentHost, shouldAcceptTenantSlugHeader } from '@/lib/tenant'

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

describe('source reference and forged review metadata', () => {
  it('requires source before review', () => {
    expect(() =>
      assertSourceReferenceRequired({
        data: {},
        incomingStatus: 'review',
      }),
    ).toThrow(/source URL or source document/i)
  })

  it('accepts externalUrl as source for documents', () => {
    expect(() =>
      assertSourceReferenceRequired({
        data: { externalUrl: 'https://example.com/doc.pdf' },
        incomingStatus: 'published',
      }),
    ).not.toThrow()
  })

  it('requires source for technical disclosure even when collection default is false', () => {
    expect(
      shouldRequireSource({
        collectionDefault: false,
        data: { disclosureLevel: 'technical' },
      }),
    ).toBe(true)
    expect(() =>
      assertSourceReferenceRequired({
        data: { disclosureLevel: 'technical' },
        incomingStatus: 'review',
        required: shouldRequireSource({
          collectionDefault: false,
          data: { disclosureLevel: 'technical' },
        }),
      }),
    ).toThrow(/source URL or source document/i)
  })

  it('keeps collection default when disclosureLevel is not technical', () => {
    expect(
      shouldRequireSource({
        collectionDefault: true,
        data: { disclosureLevel: 'none' },
      }),
    ).toBe(true)
    expect(
      shouldRequireSource({
        collectionDefault: false,
        data: { disclosureLevel: 'standard' },
      }),
    ).toBe(false)
  })

  it('treats disclosureLevel as a locked disclosure field', () => {
    expect(PERSON_DISCLOSURE_FIELDS).toContain('disclosureLevel')
    expect(() =>
      assertDisclosureWriteAllowed({
        fields: PERSON_DISCLOSURE_FIELDS,
        data: { disclosureLevel: 'standard' },
        originalDoc: { disclosureLevel: 'technical', biography: 'same' },
        previousStatus: 'published',
        incomingStatus: 'published',
      }),
    ).toThrow(/cannot be edited in place/i)
  })

  it('strips forged review fields', () => {
    expect(
      stripForgedReviewMetadata({
        body: 'x',
        reviewedBy: 1,
        reviewedAt: 't',
        publishedAt: 't',
      }),
    ).toEqual({ body: 'x' })
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

describe('platform deployment hosts', () => {
  it('treats Vercel and localhost as platform hosts', () => {
    expect(isPlatformDeploymentHost('mining-ir-platform-abc-donkimc.vercel.app')).toBe(true)
    expect(isPlatformDeploymentHost('localhost')).toBe(true)
    expect(isPlatformDeploymentHost('127.0.0.1')).toBe(true)
  })

  it('treats custom tenant subdomains as not platform hosts', () => {
    expect(isPlatformDeploymentHost('aurora-gold.example.com')).toBe(false)
    expect(isPlatformDeploymentHost('www.example.com')).toBe(false)
  })
})
