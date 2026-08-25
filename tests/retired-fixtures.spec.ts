import { describe, expect, it } from 'vitest'

import {
  SELF_EXCLUDE,
  scanRetiredFixtures,
} from '../scripts/check-retired-fixtures'

describe('retired fixture guard (ADR-0021 / S6-7)', () => {
  it('passes on the clean tracked tree (including the guard source)', () => {
    const hits = scanRetiredFixtures()
    expect(hits).toEqual([])
    expect(SELF_EXCLUDE.has('scripts/check-retired-fixtures.ts')).toBe(true)
  })

  it('fails when a retired term appears in a non-allowlisted file', () => {
    const hits = scanRetiredFixtures({
      files: ['src/poison-fixture-probe.ts'],
      readFile: () => 'This mentions aurora as a retired fixture identity.',
    })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toMatch(/src\/poison-fixture-probe\.ts matches/)
  })
})
