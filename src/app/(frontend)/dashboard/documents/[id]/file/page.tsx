import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { notFound, redirect } from 'next/navigation'
import { sanitizeFilename } from 'payload/shared'

import { getPayloadClient, requireCompanyAdmin } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

function asciiDownloadName(name: string): string {
  const cleaned = name.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  return cleaned || 'document.pdf'
}

/**
 * Serve a Document PDF for a logged-in Company Admin.
 *
 * This is a dashboard *page* (not a route handler) so it runs under
 * `dashboard/layout.tsx` → `requireCompanyAdmin()` — the same session path that
 * already works for edit screens. Route handlers were bouncing to /login.
 */
export default async function DocumentFilePage({ params }: Props) {
  const { id } = await params
  const { user, tenantId } = await requireCompanyAdmin()
  const payload = await getPayloadClient()

  let document
  try {
    document = await payload.findByID({
      collection: 'documents',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (String(relationId(document.tenant)) !== String(tenantId)) {
    notFound()
  }

  const fileId = relationId(document.file)
  if (fileId == null) notFound()

  let media
  try {
    media = await payload.findByID({
      collection: 'media',
      id: fileId,
      depth: 0,
      user,
      overrideAccess: false,
      context: { skipPublicSerializer: true },
    })
  } catch {
    notFound()
  }

  if (String(relationId(media.tenant)) !== String(tenantId)) {
    notFound()
  }

  const filename = typeof media.filename === 'string' ? media.filename : null
  if (!filename) notFound()

  if (
    !(
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_REGION &&
      process.env.S3_ENDPOINT
    )
  ) {
    throw new Error('Object storage is not configured.')
  }

  const downloadName =
    (typeof media.originalFilename === 'string' && media.originalFilename) || filename
  const contentType =
    (typeof media.mimeType === 'string' && media.mimeType) || 'application/pdf'
  const docPrefix =
    typeof (media as { prefix?: unknown }).prefix === 'string'
      ? ((media as { prefix?: string }).prefix as string)
      : ''

  const { fileKey } = getFileKey({
    collectionPrefix: '',
    docPrefix,
    filename: sanitizeFilename(filename),
    useCompositePrefixes: false,
  })

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  })

  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
      ResponseContentType: contentType,
      ResponseContentDisposition: `inline; filename="${asciiDownloadName(downloadName)}"`,
    }),
    { expiresIn: 120 },
  )

  redirect(signedUrl)
}
