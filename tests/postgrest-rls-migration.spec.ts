import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { migrations } from '../src/migrations'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationPath = path.join(
  root,
  'src/migrations/20260826_postgrest_rls_revoke.ts',
)

describe('PostgREST RLS fail-closed migration (ADR-0022)', () => {
  it('is registered in the migration index', () => {
    expect(migrations.some((m) => m.name === '20260826_postgrest_rls_revoke')).toBe(true)
  })

  it('enables RLS without FORCE and revokes anon/authenticated', () => {
    const source = fs.readFileSync(migrationPath, 'utf8')
    expect(source).toContain('ENABLE ROW LEVEL SECURITY')
    expect(source).not.toMatch(/FORCE\s+ROW\s+LEVEL\s+SECURITY/i)
    expect(source).toContain('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon')
    expect(source).toContain('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated')
    expect(source).toContain('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon')
    expect(source).toContain('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon')
    expect(source).toContain('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated')
  })

  it('documents the disposable-database rehearsal command', () => {
    // Static suite alone is not evidence — operators must run the DB-backed script
    // when a disposable URI is available: npm run test:postgrest-rls
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> }
    expect(packageJson.scripts['test:postgrest-rls']).toContain('test-postgrest-rls.mts')
    expect(fs.existsSync(path.join(root, 'scripts/test-postgrest-rls.mts'))).toBe(true)
  })
})
