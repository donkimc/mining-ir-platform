/**
 * Sanitize uploaded filenames for private object storage keys.
 * Supabase/S3 reject keys with spaces and many Unicode characters ("Invalid key").
 * Display names stay in `originalFilename`; only the stored object key is sanitized.
 */
export function buildMediaObjectKey(originalName: string, id: string): string {
  const trimmed = originalName.trim() || 'file'
  const lastDot = trimmed.lastIndexOf('.')
  const extRaw = lastDot > 0 ? trimmed.slice(lastDot + 1) : ''
  const baseRaw = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed

  const base = sanitizeSegment(baseRaw) || 'file'
  const ext = sanitizeSegment(extRaw).toLowerCase()
  const suffix = ext ? `${base}.${ext}` : base
  return `${id}-${suffix}`
}

function sanitizeSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120)
}
