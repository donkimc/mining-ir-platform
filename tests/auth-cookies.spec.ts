import { describe, expect, it } from 'vitest'

import { shouldUseSecureAuthCookie } from '@/lib/auth-cookies'

describe('auth cookie secure flag', () => {
  it('follows x-forwarded-proto over NODE_ENV', () => {
    expect(
      shouldUseSecureAuthCookie({
        forwardedProto: 'http',
        serverUrl: 'https://mining-ir-platform.vercel.app',
      }),
    ).toBe(false)

    expect(
      shouldUseSecureAuthCookie({
        forwardedProto: 'https',
        serverUrl: 'http://localhost:3000',
      }),
    ).toBe(true)
  })

  it('falls back to NEXT_PUBLIC_SERVER_URL when proto is absent', () => {
    expect(
      shouldUseSecureAuthCookie({
        forwardedProto: null,
        serverUrl: 'http://localhost:3000',
      }),
    ).toBe(false)

    expect(
      shouldUseSecureAuthCookie({
        forwardedProto: null,
        serverUrl: 'https://mining-ir-platform.vercel.app',
      }),
    ).toBe(true)
  })

  it('defaults to non-secure when protocol cannot be determined', () => {
    expect(
      shouldUseSecureAuthCookie({
        forwardedProto: null,
        serverUrl: undefined,
      }),
    ).toBe(false)
  })
})
