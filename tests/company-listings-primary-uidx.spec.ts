import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { migrations } from '../src/migrations'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationPath = path.join(
  root,
  'src/migrations/20260908_company_listings_primary_uidx.ts',
)

describe('company_listings primary uniqueness (ADR-0019)', () => {
  it('is registered as the latest migration', () => {
    const last = migrations[migrations.length - 1]
    expect(last?.name).toBe('20260908_company_listings_primary_uidx')
  })

  it('creates a partial unique index on tenant_id where is_primary is true', () => {
    const source = fs.readFileSync(migrationPath, 'utf8')
    expect(source).toContain('company_listings_one_primary_per_tenant_uidx')
    expect(source).toMatch(/CREATE UNIQUE INDEX[\s\S]*"company_listings"\s*\(\s*"tenant_id"\s*\)/)
    expect(source).toMatch(/WHERE\s+"is_primary"\s*=\s*true/)
    expect(source).toContain('DROP INDEX IF EXISTS "company_listings_one_primary_per_tenant_uidx"')
  })
})
