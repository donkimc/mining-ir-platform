import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { NextResponse } from 'next/server'
import { sanitizeFilename } from 'payload/shared'

import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { relationId } from '@/lib/publishing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function asciiDownloadName(name: string): string {
  const cleaned = name.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  return cleaned || 'document.pdf'
}

/**
 * Stream a Document PDF for a logged-in Company Admin.
 *
 * Intentionally does **not** redirect to a Supabase signed URL. Signed URLs are
 * bearer tokens: anyone who copies them can open the object until expiry, which
 * is unacceptable for Draft/Review disclosure files. Bytes stay behind this
 * session-checked app path; incognito without a cookie must get Login.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user || user.status !== 'active') {
    return NextResponse.redirect(
      new URL(`/login?next=/dashboard/documents/${id}/file`, request.url),
    )
  }

  const payload = await getPayloadClient()

  // Resolve tenant the same way dashboard pages do (active company_admin membership).
  const memberships = await payload.find({
    collection: 'tenant-memberships',
    where: {
      and: [
        { user: { equals: user.id } },
        { status: { equals: 'active' } },
        { role: { equals: 'company_admin' } },
      ],
    },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  })

  if (memberships.docs.length !== 1) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  const tenant = memberships.docs[0].tenant
  const tenantId =
    tenant && typeof tenant === 'object' && 'id' in tenant
      ? tenant.id
      : (tenant as string | number)

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

  if (String(relationId(document.tenant)) !== String(tenantId)) {
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
      context: { skipPublicSerializer: true },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }

  if (String(relationId(media.tenant)) !== String(tenantId)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filename = typeof media.filename === 'string' ? media.filename : null
  if (!filename) {
    return new NextResponse('File missing', { status: 404 })
  }

  if (
    !(
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_REGION &&
      process.env.S3_ENDPOINT
    )
  ) {
    return new NextResponse('Object storage is not configured', { status: 503 })
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

  try {
    const client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
    })

    const object = await client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
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
        'Content-Disposition': `inline; filename="${asciiDownloadName(downloadName)}"`,
        // Prevent shared caches / BFCache from retaining sensitive Draft bytes.
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
      },
    })
  } catch (error) {
    console.error(
      '[dashboard/documents/file]',
      filename,
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    )
    return new NextResponse('Unable to load file', { status: 502 })
  }
}
