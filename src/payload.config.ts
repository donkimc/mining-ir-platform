import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Catalysts } from './collections/Catalysts'
import { Companies } from './collections/Companies'
import { Documents } from './collections/Documents'
import { ExplorationContents } from './collections/ExplorationContents'
import { InvestmentHighlights } from './collections/InvestmentHighlights'
import { Media } from './collections/Media'
import { NewsReleases } from './collections/NewsReleases'
import { People } from './collections/People'
import { Projects } from './collections/Projects'
import { ShareStructures } from './collections/ShareStructures'
import { TenantMemberships } from './collections/TenantMemberships'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useS3Storage = Boolean(
  process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_REGION &&
    process.env.S3_ENDPOINT,
)

const enableDatabasePush = process.env.PAYLOAD_DATABASE_PUSH === 'true'
const isNextProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (enableDatabasePush && process.env.NODE_ENV === 'production' && !isNextProductionBuild) {
  throw new Error(
    'PAYLOAD_DATABASE_PUSH=true is not allowed when NODE_ENV=production. Set PAYLOAD_DATABASE_PUSH=false and run migrations.',
  )
}

function resolveDatabaseSsl(): { ssl?: { ca?: string; rejectUnauthorized?: boolean } } {
  const ca = process.env.DATABASE_SSL_CA
  if (ca && ca.trim().length > 0) {
    return { ssl: { ca, rejectUnauthorized: true } }
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    if (process.env.NODE_ENV === 'production' && !isNextProductionBuild) {
      throw new Error(
        'DATABASE_SSL_REJECT_UNAUTHORIZED=false is not allowed when NODE_ENV=production. Set DATABASE_SSL_CA to the Supabase (or provider) CA PEM instead.',
      )
    }
    console.warn(
      '[payload] DATABASE_SSL_REJECT_UNAUTHORIZED=false — TLS certificate verification is disabled (non-production only). Prefer DATABASE_SSL_CA.',
    )
    return { ssl: { rejectUnauthorized: false } }
  }

  return {}
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Mining IR CMS',
    },
  },
  // Product Platform Admin lives at /admin/*; Payload CMS UI is at /cms.
  routes: {
    admin: '/cms',
  },
  collections: [
    Users,
    Companies,
    TenantMemberships,
    Projects,
    InvestmentHighlights,
    Catalysts,
    NewsReleases,
    Documents,
    People,
    ShareStructures,
    ExplorationContents,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ...resolveDatabaseSsl(),
    },
    // Opt-in only. Local `.env` should set PAYLOAD_DATABASE_PUSH=true; Preview/Production omit or set false and migrate.
    push: enableDatabasePush,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    ...(useS3Storage
      ? [
          s3Storage({
            collections: {
              // Keep Payload access control; never emit public bucket URLs.
              media: {
                generateFileURL: ({ filename }) =>
                  `/api/media/file/${encodeURIComponent(filename)}`,
              },
            },
            bucket: process.env.S3_BUCKET as string,
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
              },
              region: process.env.S3_REGION as string,
              endpoint: process.env.S3_ENDPOINT as string,
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
})
