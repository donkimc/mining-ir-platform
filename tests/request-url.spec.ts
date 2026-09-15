import { afterEach, describe, expect, it, vi } from 'vitest'

import { absoluteAppUrl, getPublicRequestOrigin, isInternalRequestHost } from '@/lib/request-url'

describe('request-url public origin (Railway/Cloudflare)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('detects internal hosts', () => {
    expect(isInternalRequestHost('localhost:8080')).toBe(true)
    expect(isInternalRequestHost('127.0.0.1:8080')).toBe(true)
    expect(isInternalRequestHost('admin.nrlaunch.com')).toBe(false)
  })

  it('prefers x-forwarded-host over localhost request.url', () => {
    const request = new Request('https://localhost:8080/logout', {
      headers: {
        host: 'localhost:8080',
        'x-forwarded-host': 'admin.nrlaunch.com',
        'x-forwarded-proto': 'https',
      },
    })
    expect(getPublicRequestOrigin(request)).toBe('https://admin.nrlaunch.com')
    expect(absoluteAppUrl(request, '/login').toString()).toBe('https://admin.nrlaunch.com/login')
  })

  it('falls back to admin.nrlaunch.com in production when only localhost is visible', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const request = new Request('https://localhost:8080/logout', {
      headers: { host: 'localhost:8080' },
    })
    expect(getPublicRequestOrigin(request)).toBe('https://admin.nrlaunch.com')
  })
})
