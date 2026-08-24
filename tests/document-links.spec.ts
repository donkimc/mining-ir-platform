import { describe, expect, it } from 'vitest'

import { isDemoPlaceholderUrl, publicDocumentOpenHref } from '@/lib/document-links'

describe('publicDocumentOpenHref', () => {
  it('prefers uploaded media over external URL', () => {
    expect(
      publicDocumentOpenHref({
        file: { filename: 'abc-report.pdf' } as never,
        externalUrl: 'https://example.com/ignored.pdf',
      }),
    ).toBe('/api/media/file/abc-report.pdf')
  })

  it('uses a real external URL when no file is attached', () => {
    expect(
      publicDocumentOpenHref({
        file: null,
        externalUrl: 'https://cdn.issuer.example/deck.pdf',
      }),
    ).toBe('https://cdn.issuer.example/deck.pdf')
  })

  it('hides demo example.com placeholders when there is no file', () => {
    expect(
      publicDocumentOpenHref({
        file: null,
        externalUrl: 'https://example.com/veylithra-tungsten-corporate-presentation.pdf',
      }),
    ).toBeNull()
    expect(isDemoPlaceholderUrl('https://example.com/x.pdf')).toBe(true)
  })
})
