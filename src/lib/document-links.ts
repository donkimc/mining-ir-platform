import type { Document, Media } from '@/payload-types'

function mediaFilename(file: Document['file']): string | null {
  if (!file || typeof file !== 'object') return null
  const media = file as Media
  return typeof media.filename === 'string' && media.filename.trim() ? media.filename : null
}

/** Demo seed often uses example.com as a source citation, not a real download. */
export function isDemoPlaceholderUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'example.com' || host.endsWith('.example.com')
  } catch {
    return false
  }
}

/**
 * Public investor open target for a Published document.
 * Prefer private media served through the app authorization path; then a real external URL.
 */
export function publicDocumentOpenHref(doc: Pick<Document, 'file' | 'externalUrl'>): string | null {
  const filename = mediaFilename(doc.file)
  if (filename) {
    return `/api/media/file/${encodeURIComponent(filename)}`
  }

  const external = typeof doc.externalUrl === 'string' ? doc.externalUrl.trim() : ''
  if (external && !isDemoPlaceholderUrl(external)) {
    return external
  }

  return null
}
