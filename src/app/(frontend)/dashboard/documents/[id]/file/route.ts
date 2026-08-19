import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

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

/**
 * Authenticated Company Admin download for a Document's attached PDF.
 * Uses session JWT via getCurrentUser (same path as dashboard), not anonymous
 * `/api/media/file` access — Draft/Review files must stay private to the tenant.
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

  try {
    if (isS3StorageConfigured()) {
      const client = new S3Client({
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        },
        region: process.env.S3_REGION as string,
        endpoint: process.env.S3_ENDPOINT as string,
        forcePathStyle: true,
      })
      const object = await client.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET as string,
          Key: filename,
        }),
      )
      if (!object.Body) {
        return new NextResponse('Empty object', { status: 404 })
      }
      const bytes = Buffer.from(await object.Body.transformToByteArray())
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(bytes.length),
          'Content-Disposition': `inline; filename="${downloadName.replace(/"/g, '')}"`,
          'Cache-Control': 'private, no-store',
        },
      })
    }

    const localPath = path.join(process.cwd(), 'media', filename)
    const bytes = await readFile(localPath)
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `inline; filename="${downloadName.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return new NextResponse('Unable to load file', { status: 502 })
  }
}
