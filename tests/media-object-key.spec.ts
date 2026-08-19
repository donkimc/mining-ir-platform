import { describe, expect, it } from 'vitest'

import { buildMediaObjectKey } from '@/lib/media-object-key'

describe('buildMediaObjectKey', () => {
  it('strips spaces and unicode punctuation that Supabase rejects as Invalid key', () => {
    const key = buildMediaObjectKey(
      'Dario Amodei — Machines of Loving Grace.pdf',
      '96ca17f7-2f35-4551-aa58-5ea9c6727ca7',
    )
    expect(key).toBe(
      '96ca17f7-2f35-4551-aa58-5ea9c6727ca7-Dario-Amodei-Machines-of-Loving-Grace.pdf',
    )
    expect(key).not.toMatch(/\s/)
    expect(key).not.toMatch(/—/)
  })

  it('retains simple slug-safe names', () => {
    expect(buildMediaObjectKey('ni-43-101-technical-report.pdf', 'abc')).toBe(
      'abc-ni-43-101-technical-report.pdf',
    )
  })
})
