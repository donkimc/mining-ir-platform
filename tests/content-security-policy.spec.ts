import { describe, expect, it } from 'vitest'

import { CONTENT_SECURITY_POLICY } from '@/lib/content-security-policy'

describe('Content-Security-Policy (S4-1)', () => {
  it('includes a frame-src directive permitting only the OpenStreetMap origin', () => {
    expect(CONTENT_SECURITY_POLICY).toMatch(/frame-src\s+https:\/\/www\.openstreetmap\.org(?:\s|;|$)/)
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/frame-src[^;]*\*/)
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/frame-src[^;]*'unsafe-/)
  })

  it('does not loosen default-src away from self', () => {
    expect(CONTENT_SECURITY_POLICY).toMatch(/default-src\s+'self'/)
  })
})
