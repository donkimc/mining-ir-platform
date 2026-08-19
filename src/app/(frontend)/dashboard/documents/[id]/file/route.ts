import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { NextResponse } from 'next/server'
import { sanitizeFilename } from 'payload/shared'

import { getAuthHeaders, getCurrentUser, getPayloadClient } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

function isS3StorageConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_REGION &&
      process.env.S3_ENDPOINT,
  )
}

function asciiDownloadName(name: string): string {
  const cleaned = name.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  return cleaned || 'document.pdf'
}

async function redirectToSignedObject(args: {
  filename: string
  downloadName: string
  contentType: string
  docPrefix?: string
}): Promise<NextResponse> {
  const { fileKey } = getFileKey({
    collectionPrefix: '',
    docPrefix: args.docPrefix || '',
    filename: sanitizeFilename(args.filename),
    useCompositePrefixes: false,
  })

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
    region: process.env.S3_REGION as string,
    endpoint: process.env.S3_ENDPOINT as string,
    forcePathStyle: true,
  })

  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET as string,
      Key: fileKey,
      ResponseContentType: args.contentType,
      ResponseContentDisposition: `inline; filename="${asciiDownloadName(args.downloadName)}"`,
    }),
    { expiresIn: 120 },
  )

  return NextResponse.redirect(signedUrl, 302)
}

/**
 * Authenticated Company Admin download for a Document's attached PDF.
 *
 * Confirms Document/Media access via Local API, then serves via:
 * 1) Payload `/api/media/file` with session JWT (uses signedDownloads when configured), or
 * 2) a short-lived S3 signed URL built with the same key helper Payload uses on upload.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user || user.status !== 'active') {
    return NextResponse.redirect(new URL(`/login?next=/dashboard/documents/${id}`, request.url))
  }

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
    return new NextResponse('Not found', { status: 404 })
  }

  const fileId = relationId(document.file)
  if (fileId == null) {
    return new NextResponse('No file attached', { status: 404 })
  }

  let media
  try {
    media = await payload.findByID({
      collection: 'media',
      id: fileId,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }

  const filename = typeof media.filename === 'string' ? media.filename : null
  if (!filename) {
    return new NextResponse('File missing', { status: 404 })
  }

  const downloadName =
    (typeof media.originalFilename === 'string' && media.originalFilename) || filename
  const contentType =
    (typeof media.mimeType === 'string' && media.mimeType) || 'application/pdf'
  const docPrefix =
    typeof (media as { prefix?: unknown }).prefix === 'string'
      ? ((media as { prefix?: string }).prefix as string)
      : ''

  const authHeaders = await getAuthHeaders()
  const authorization = authHeaders.get('Authorization')

  try {
    if (authorization) {
      const upstreamUrl = new URL(`/api/media/file/${encodeURIComponent(filename)}`, request.url)
      const upstream = await fetch(upstreamUrl, {
        headers: { Authorization: authorization },
        redirect: 'manual',
        cache: 'no-store',
      })

      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get('location')
        if (location) return NextResponse.redirect(location, 302)
      }

      if (upstream.ok && upstream.body) {
        const headers = new Headers()
        headers.set('Content-Type', upstream.headers.get('Content-Type') || contentType)
        headers.set(
          'Content-Disposition',
          `inline; filename="${asciiDownloadName(downloadName)}"`,
        )
        headers.set('Cache-Control', 'private, no-store')
        const length = upstream.headers.get('Content-Length')
        if (length) headers.set('Content-Length', length)
        return new NextResponse(upstream.body, { status: 200, headers })
      }

      console.error(
        '[dashboard/documents/file] upstream',
        filename,
        upstream.status,
      )
    }

    if (isS3StorageConfigured()) {
      return await redirectToSignedObject({
        filename,
        downloadName,
        contentType,
        docPrefix,
      })
    }

    return new NextResponse('Unable to load file', { status: 502 })
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown'
    console.error('[dashboard/documents/file]', filename, message)

    if (isS3StorageConfigured()) {
      try {
        return await redirectToSignedObject({
          filename,
          downloadName,
          contentType,
          docPrefix,
        })
      } catch (fallbackError) {
        console.error(
          '[dashboard/documents/file] signed fallback',
          fallbackError instanceof Error ? fallbackError.message : fallbackError,
        )
      }
    }

    return new NextResponse('Unable to load file', { status: 502 })
  }
}
