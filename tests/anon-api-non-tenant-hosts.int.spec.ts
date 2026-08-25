import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'

/**
 * S6-1: anonymous `/api/*` on non-tenant hosts must not 500.
 * Access helpers call resolveRequestTenant via next/headers Host — mock Host here and
 * exercise Payload Local API the same way REST access does (overrideAccess: false, no user).
 */

const hostState = { value: 'localhost:3000' }

vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({
      host: hostState.value,
    }),
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
  }),
}))

describe('anonymous API on non-tenant hosts (S6-1)', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  /** Hosts that never use DEFAULT_TENANT_SLUG (ADR-0016). */
  const nonTenantHosts = [
    { label: 'apex', host: 'nrlaunch.com' },
    { label: 'reserved', host: 'demo.nrlaunch.com' },
    { label: 'unknown_platform', host: 'a.b.nrlaunch.com' },
  ] as const

  for (const { label, host } of nonTenantHosts) {
    it(`projects (shared helper) returns empty docs on ${label}`, async () => {
      hostState.value = host
      const result = await payload.find({
        collection: 'projects',
        limit: 5,
        depth: 0,
        overrideAccess: false,
        user: undefined,
      })
      expect(result.docs).toEqual([])
      expect(result.totalDocs).toBe(0)
    })

    it(`companies (own read) returns empty docs on ${label}`, async () => {
      hostState.value = host
      const result = await payload.find({
        collection: 'companies',
        limit: 5,
        depth: 0,
        overrideAccess: false,
        user: undefined,
      })
      expect(result.docs).toEqual([])
      expect(result.totalDocs).toBe(0)
    })

    it(`media (own read) returns empty docs on ${label}`, async () => {
      hostState.value = host
      const result = await payload.find({
        collection: 'media',
        limit: 5,
        depth: 0,
        overrideAccess: false,
        user: undefined,
      })
      expect(result.docs).toEqual([])
      expect(result.totalDocs).toBe(0)
    })
  }

  it('vercel.app preview returns empty when NODE_ENV=production (no DEFAULT_TENANT_SLUG)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    hostState.value = 'mining-ir-platform.vercel.app'
    for (const collection of ['projects', 'companies', 'media'] as const) {
      const result = await payload.find({
        collection,
        limit: 5,
        depth: 0,
        overrideAccess: false,
        user: undefined,
      })
      expect(result.docs, collection).toEqual([])
      expect(result.totalDocs, collection).toBe(0)
    }
  })

  it('tenant host still returns published projects for the resolved slug', async () => {
    hostState.value = 'qelvarion-resource.nrlaunch.com'
    const result = await payload.find({
      collection: 'projects',
      limit: 20,
      depth: 0,
      overrideAccess: false,
      user: undefined,
    })
    expect(result.totalDocs).toBeGreaterThan(0)
    for (const doc of result.docs) {
      expect(doc.status).toBe('published')
    }
  })
})
