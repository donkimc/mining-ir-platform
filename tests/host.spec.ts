import { describe, expect, it } from 'vitest'

import {
  classifyHost,
  isReservedTenantLabel,
  mayUseDefaultTenantSlug,
  normalizeHostname,
} from '@/lib/host'

describe('host classification (ADR-0016)', () => {
  it('normalizes mixed case, trailing dots and ports', () => {
    expect(normalizeHostname('Qelvarion-Resource.Nrlaunch.Com:443.')).toBe(
      'qelvarion-resource.nrlaunch.com',
    )
  })

  it('classifies apex, www and admin', () => {
    expect(classifyHost('nrlaunch.com').kind).toBe('apex')
    expect(classifyHost('www.nrlaunch.com').kind).toBe('www')
    expect(classifyHost('admin.nrlaunch.com').kind).toBe('admin')
  })

  it('accepts exact tenant subdomains only', () => {
    const host = classifyHost('qelvarion-resource.nrlaunch.com')
    expect(host.kind).toBe('tenant')
    expect(host.tenantSubdomain).toBe('qelvarion-resource')

    expect(classifyHost('veylithra-tungsten.nrlaunch.com').tenantSubdomain).toBe(
      'veylithra-tungsten',
    )
    expect(classifyHost('zenthoriq-resource.nrlaunch.com').tenantSubdomain).toBe(
      'zenthoriq-resource',
    )
  })

  it('rejects reserved and typo hosts without tenant fallback labels', () => {
    expect(classifyHost('demo.nrlaunch.com').kind).toBe('reserved')
    expect(classifyHost('cms.nrlaunch.com').kind).toBe('reserved')
    expect(classifyHost('typo.nrlaunch.com').kind).toBe('tenant')
    expect(classifyHost('typo.nrlaunch.com').tenantSubdomain).toBe('typo')
    expect(isReservedTenantLabel('admin')).toBe(true)
    expect(classifyHost('a.b.nrlaunch.com').kind).toBe('unknown_platform')
  })

  it('never allows DEFAULT_TENANT_SLUG on production or nrlaunch hosts', () => {
    expect(
      mayUseDefaultTenantSlug({ hostname: 'nrlaunch.com', nodeEnv: 'development' }),
    ).toBe(false)
    expect(
      mayUseDefaultTenantSlug({
        hostname: 'qelvarion-resource.nrlaunch.com',
        nodeEnv: 'development',
      }),
    ).toBe(false)
    expect(mayUseDefaultTenantSlug({ hostname: 'localhost', nodeEnv: 'production' })).toBe(
      false,
    )
    expect(mayUseDefaultTenantSlug({ hostname: 'localhost', nodeEnv: 'development' })).toBe(
      true,
    )
  })
})
