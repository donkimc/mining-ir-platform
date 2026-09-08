import { describe, expect, it } from 'vitest'

import {
  ADMIN_CONTENT_SECURITY_POLICY,
  CONTENT_SECURITY_POLICY,
  PUBLIC_CONTENT_SECURITY_POLICY,
} from '@/lib/content-security-policy'

describe('Content-Security-Policy (S4-1 + public/admin split)', () => {
  it('includes a frame-src directive permitting only the OpenStreetMap origin', () => {
    for (const policy of [PUBLIC_CONTENT_SECURITY_POLICY, ADMIN_CONTENT_SECURITY_POLICY]) {
      expect(policy).toMatch(/frame-src\s+https:\/\/www\.openstreetmap\.org(?:\s|;|$)/)
      expect(policy).not.toMatch(/frame-src[^;]*\*/)
      expect(policy).not.toMatch(/frame-src[^;]*'unsafe-/)
    }
  })

  it('does not loosen default-src away from self', () => {
    expect(PUBLIC_CONTENT_SECURITY_POLICY).toMatch(/default-src\s+'self'/)
    expect(ADMIN_CONTENT_SECURITY_POLICY).toMatch(/default-src\s+'self'/)
  })

  it('keeps public script-src free of unsafe-eval while admin retains it for Payload CMS', () => {
    expect(PUBLIC_CONTENT_SECURITY_POLICY).toMatch(/script-src\s+'self'\s+'unsafe-inline'(?:\s|;|$)/)
    expect(PUBLIC_CONTENT_SECURITY_POLICY).not.toMatch(/script-src[^;]*'unsafe-eval'/)
    expect(ADMIN_CONTENT_SECURITY_POLICY).toMatch(/script-src[^;]*'unsafe-eval'/)
  })

  it('exports CONTENT_SECURITY_POLICY as the public (default) policy', () => {
    expect(CONTENT_SECURITY_POLICY).toBe(PUBLIC_CONTENT_SECURITY_POLICY)
  })
})
