import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Catalysts } from './collections/Catalysts'
import { Companies } from './collections/Companies'
import { CompanyListings } from './collections/CompanyListings'
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
import { resolveDatabaseSsl, resolveEnableDatabasePush } from './lib/database-guards'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useS3Storage = Boolean(
  process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_REGION &&
    process.env.S3_ENDPOINT,
)

const enableDatabasePush = resolveEnableDatabasePush()

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
    CompanyListings,
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
    // Preview/Production + push=true throws (including Next build phase). Build forces push off via resolveEnableDatabasePush.
    // Vercel requires DATABASE_SSL_CA (ALLOW_INSECURE_DB_SSL removed in Sprint 3).
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
              // Do not enable signedDownloads for media: short-lived signed URLs are still
              // bearer tokens and must not be used for Draft/Review disclosure files.
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
