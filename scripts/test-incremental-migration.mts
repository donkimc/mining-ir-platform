/**
 * Incremental migration rehearsal against a prior Sprint 2 schema.
 *
 * Creates an empty database, applies only `20260812_061650_sprint2_content`
 * (Sprint 2 shape WITHOUT media.original_filename), asserts the column is
 * absent, applies `20260812_132324_media_original_filename`, asserts the
 * column exists, then runs the down migration and confirms the column is gone.
 *
 * Usage:
 *   DATABASE_URI=postgres://…/mining_ir_migrate_test npm run test:incremental-migration
 *
 * Never point this at Production.
 */
import { config as loadEnv } from 'dotenv'
import pg from 'pg'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function requireUri(): string {
  const uri = process.env.INCREMENTAL_MIGRATION_DATABASE_URI || process.env.DATABASE_URI
  if (!uri) {
    throw new Error('Set INCREMENTAL_MIGRATION_DATABASE_URI (preferred) or DATABASE_URI')
  }
  if (/prod|production/i.test(uri) && !process.env.ALLOW_DESTRUCTIVE_MIGRATE_TEST) {
    throw new Error('Refusing to run destructive migration test against a URI that looks like production')
  }
  return uri
}

/** Extract the SQL string from a Payload migration `up`/`down` template. */
function extractSqlFromMigration(filePath: string, fn: 'up' | 'down'): string {
  const src = readFileSync(filePath, 'utf8')
  const re =
    fn === 'up'
      ? /export async function up[\s\S]*?await db\.execute\(sql`([\s\S]*?)`\)/
      : /export async function down[\s\S]*?await db\.execute\(sql`([\s\S]*?)`\)/
  const match = src.match(re)
  if (!match?.[1]) {
    throw new Error(`Could not extract ${fn} SQL from ${filePath}`)
  }
  return match[1].trim()
}

async function columnExists(client: pg.Client, table: string, column: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  )
  return (result.rowCount ?? 0) > 0
}

async function main() {
  const uri = requireUri()
  const client = new pg.Client({ connectionString: uri })
  await client.connect()

  console.log('[incremental-migration] connected; resetting public schema…')
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
  await client.query('GRANT ALL ON SCHEMA public TO public')

  const sprint2Path = path.join(root, 'src/migrations/20260812_061650_sprint2_content.ts')
  const mediaPath = path.join(root, 'src/migrations/20260812_132324_media_original_filename.ts')

  const sprint2Sql = extractSqlFromMigration(sprint2Path, 'up')
  console.log('[incremental-migration] applying Sprint 2 baseline migration…')
  await client.query(sprint2Sql)

  if (await columnExists(client, 'media', 'original_filename')) {
    throw new Error('Expected original_filename to be ABSENT after Sprint 2 baseline')
  }
  console.log('[incremental-migration] OK — Sprint 2 schema has no original_filename')

  const mediaUp = extractSqlFromMigration(mediaPath, 'up')
  console.log('[incremental-migration] applying media.original_filename migration…')
  await client.query(mediaUp)

  if (!(await columnExists(client, 'media', 'original_filename'))) {
    throw new Error('Expected original_filename to EXIST after incremental migration')
  }
  console.log('[incremental-migration] OK — column present after upgrade')

  const mediaDown = extractSqlFromMigration(mediaPath, 'down')
  console.log('[incremental-migration] rolling back media.original_filename…')
  await client.query(mediaDown)

  if (await columnExists(client, 'media', 'original_filename')) {
    throw new Error('Expected original_filename to be ABSENT after down migration')
  }
  console.log('[incremental-migration] OK — rollback removed column')

  // Re-apply forward for a recovered-forward state
  await client.query(mediaUp)
  if (!(await columnExists(client, 'media', 'original_filename'))) {
    throw new Error('Expected original_filename after forward recovery')
  }
  console.log('[incremental-migration] OK — forward recovery re-applied column')

  await client.end()
  console.log('[incremental-migration] PASS')
}

main().catch((err) => {
  console.error('[incremental-migration] FAIL', err)
  process.exit(1)
})
