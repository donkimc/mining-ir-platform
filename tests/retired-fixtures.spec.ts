import { describe, expect, it } from 'vitest'

import {
  SELF_EXCLUDE,
  isExcludedFromScan,
  scanRetiredFixtures,
} from '../scripts/check-retired-fixtures'

/** Synthesize at runtime so no literal retired term exists in this tracked file. */
function retiredGoldName(): string {
  return String.fromCharCode(97, 117, 114, 111, 114, 97)
}

describe('retired fixture guard (ADR-0021 / S6-7)', () => {
  it('passes on the clean tracked tree (including the guard source)', () => {
    const hits = scanRetiredFixtures()
    expect(hits).toEqual([])
    expect(SELF_EXCLUDE.has('scripts/check-retired-fixtures.ts')).toBe(true)
  })

  it('fails when a retired term appears in a non-allowlisted file', () => {
    const hits = scanRetiredFixtures({
      files: ['src/poison-fixture-probe.ts'],
      readFile: () => `This mentions ${retiredGoldName()} as a retired fixture identity.`,
    })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toMatch(/src\/poison-fixture-probe\.ts matches/)
  })

  it('exempts sprint evidence paths by rule, not arbitrary src files', () => {
    expect(isExcludedFromScan('docs/SPRINT9_REVIEW.md')).toBe(true)
    expect(isExcludedFromScan('docs/SPRINT9_HANDOFF.md')).toBe(true)
    expect(isExcludedFromScan('docs/SPRINT9_REREVIEW.md')).toBe(true)
    expect(isExcludedFromScan('docs/SPRINT9_CARRYFORWARD.md')).toBe(true)
    expect(isExcludedFromScan('docs/decisions/ADR-0021-fixture-identity-clearance.md')).toBe(
      true,
    )
    expect(isExcludedFromScan('src/anything.ts')).toBe(false)
    expect(isExcludedFromScan('scripts/check-retired-fixtures.ts')).toBe(true)
  })
})
