/**
 * Bounded document ingestion helpers (ADR-0014).
 */

export const INGESTION_MAX_BYTES = 10 * 1024 * 1024
export const INGESTION_ALLOWED_MIME = new Set(['application/pdf'])
export const INGESTION_ALLOWED_EXTENSIONS = new Set(['.pdf'])

export function assertAllowedIngestionFile(args: {
  mimeType?: string | null
  filename?: string | null
  sizeBytes?: number | null
}): void {
  const name = (args.filename || '').toLowerCase()
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const mime = (args.mimeType || '').toLowerCase()

  const mimeOk = mime ? INGESTION_ALLOWED_MIME.has(mime) : false
  const extOk = ext ? INGESTION_ALLOWED_EXTENSIONS.has(ext) : false
  if (!mimeOk && !extOk) {
    throw new Error('Only PDF uploads are allowed for document ingestion.')
  }

  if (typeof args.sizeBytes === 'number' && args.sizeBytes > INGESTION_MAX_BYTES) {
    throw new Error('File exceeds the 10 MiB ingestion limit.')
  }
}
