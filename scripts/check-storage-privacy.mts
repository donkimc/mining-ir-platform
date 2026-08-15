/**
 * Probe whether a Supabase Storage object is anonymously downloadable via the
 * public object URL. Sprint 3 requires the media bucket to be private.
 *
 * Usage:
 *   S3_ENDPOINT=https://PROJECT.storage.supabase.co/storage/v1/s3 \
 *   STORAGE_PROBE_OBJECT_KEY=<uuid-prefixed-filename> \
 *   npm run check:storage-privacy
 *
 * Or with a full public URL:
 *   STORAGE_PROBE_PUBLIC_URL=https://PROJECT.supabase.co/storage/v1/object/public/media/<key> \
 *   npm run check:storage-privacy
 *
 * Exit 0 = denied (expected for private bucket)
 * Exit 1 = bytes returned (bucket still public — Critical)
 * Exit 2 = misconfiguration
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env.staging.local' })
loadEnv({ path: '.env' })

function buildPublicUrl(): string {
  if (process.env.STORAGE_PROBE_PUBLIC_URL) {
    return process.env.STORAGE_PROBE_PUBLIC_URL
  }

  const key = process.env.STORAGE_PROBE_OBJECT_KEY
  const bucket = process.env.S3_BUCKET || 'media'
  const endpoint = process.env.S3_ENDPOINT || ''

  if (!key) {
    console.error('Set STORAGE_PROBE_PUBLIC_URL or STORAGE_PROBE_OBJECT_KEY')
    process.exit(2)
  }

  // S3 endpoint: https://PROJECT.storage.supabase.co/storage/v1/s3
  // Public URL:  https://PROJECT.supabase.co/storage/v1/object/public/BUCKET/KEY
  const projectHost = endpoint
    .replace(/\/storage\/v1\/s3\/?$/, '')
    .replace('.storage.supabase.co', '.supabase.co')

  if (!projectHost.startsWith('http')) {
    console.error('Could not derive public URL from S3_ENDPOINT; set STORAGE_PROBE_PUBLIC_URL')
    process.exit(2)
  }

  return `${projectHost}/storage/v1/object/public/${bucket}/${encodeURIComponent(key)}`
}

async function main() {
  const url = buildPublicUrl()
  console.log('[storage-privacy] probing', url.replace(/\/\/([^/]+)/, '//$1'))

  const res = await fetch(url, { method: 'GET', redirect: 'manual' })
  const buf = Buffer.from(await res.arrayBuffer())
  const status = res.status

  console.log('[storage-privacy] status', status, 'bytes', buf.length)

  if (status >= 200 && status < 300 && buf.length > 0) {
    console.error(
      '[storage-privacy] FAIL — object bytes are anonymously downloadable. Set the Supabase media bucket to private (public = false).',
    )
    process.exit(1)
  }

  console.log('[storage-privacy] PASS — direct object URL did not return file bytes')
}

main().catch((err) => {
  console.error('[storage-privacy] error', err)
  process.exit(2)
})
