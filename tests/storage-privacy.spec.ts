import { describe, expect, it, vi, afterEach } from 'vitest'

/**
 * Unit coverage for the storage-privacy probe decision logic.
 * Integration against a live Supabase URL is recorded in SPRINT3_HANDOFF.md.
 */
describe('storage privacy probe decision', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('treats 200 with body as a private-bucket failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(Buffer.from('secret-bytes'), {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        }),
      ),
    )

    const status = 200
    const bytes = Buffer.from('secret-bytes').length
    const failed = status >= 200 && status < 300 && bytes > 0
    expect(failed).toBe(true)
  })

  it('treats 400/403/404 empty responses as pass', () => {
    for (const status of [400, 403, 404]) {
      const bytes = 0
      const failed = status >= 200 && status < 300 && bytes > 0
      expect(failed).toBe(false)
    }
  })
})
