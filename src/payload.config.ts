import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Catalysts } from './collections/Catalysts'
import { Companies } from './collections/Companies'
import { InvestmentHighlights } from './collections/InvestmentHighlights'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { ShareStructures } from './collections/ShareStructures'
import { TenantMemberships } from './collections/TenantMemberships'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    ShareStructures,
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
    },
    push: true,
  }),
  sharp,
})
