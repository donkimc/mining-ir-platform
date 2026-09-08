/**
 * ADR-0022 database-backed rehearsal: enable RLS + revoke anon/authenticated
 * against a disposable Postgres database.
 *
 * Creates fixture roles and tables, applies the checked-in migration SQL,
 * then asserts:
 *   - every public base table has RLS enabled
 *   - FORCE ROW LEVEL SECURITY is not set
 *   - anon / authenticated have no table or sequence privileges in public
 *
 * Usage:
 *   POSTGREST_RLS_DATABASE_URI=postgres://…/disposable npm run test:postgrest-rls
 *
 * Falls back to INCREMENTAL_MIGRATION_DATABASE_URI or DATABASE_URI.
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
const migrationPath = path.join(root, 'src/migrations/20260826_postgrest_rls_revoke.ts')

function requireUri(): string {
  const uri =
    process.env.POSTGREST_RLS_DATABASE_URI ||
    process.env.INCREMENTAL_MIGRATION_DATABASE_URI ||
    process.env.DATABASE_URI
  if (!uri) {
    throw new Error(
      'Set POSTGREST_RLS_DATABASE_URI (preferred), INCREMENTAL_MIGRATION_DATABASE_URI, or DATABASE_URI',
    )
  }
  if (/prod|production/i.test(uri) && !process.env.ALLOW_DESTRUCTIVE_MIGRATE_TEST) {
    throw new Error(
      'Refusing to run destructive PostgREST RLS test against a URI that looks like production',
    )
  }
  return uri
}

/** Extract every `db.execute(sql\`...\`)` body from a Payload migration file. */
function extractAllSqlBlocks(filePath: string, fn: 'up' | 'down'): string[] {
  const src = readFileSync(filePath, 'utf8')
  const fnStart = src.indexOf(`export async function ${fn}`)
  if (fnStart < 0) {
    throw new Error(`Could not find ${fn}() in ${filePath}`)
  }
  const nextExport = src.indexOf('export async function', fnStart + 1)
  const body = nextExport >= 0 ? src.slice(fnStart, nextExport) : src.slice(fnStart)
  const blocks: string[] = []
  const re = /await db\.execute\(sql`([\s\S]*?)`\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body)) !== null) {
    blocks.push(match[1].trim())
  }
  if (blocks.length === 0) {
    throw new Error(`No SQL blocks found in ${fn}() of ${filePath}`)
  }
  return blocks
}

async function main() {
  const uri = requireUri()
  const client = new pg.Client({ connectionString: uri })
  await client.connect()

  console.log('[postgrest-rls] connected; resetting public schema…')
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
  await client.query('GRANT ALL ON SCHEMA public TO public')

  // Local Postgres may not have Supabase roles — create them for the rehearsal.
  await client.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
  END $$;`)

  console.log('[postgrest-rls] creating fixture tables with grants…')
  await client.query(`
    CREATE TABLE public.companies (
      id serial PRIMARY KEY,
      name text NOT NULL
    );
    CREATE TABLE public.media (
      id serial PRIMARY KEY,
      filename text
    );
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
  `)

  const beforeRls = await client.query<{ tablename: string; rls: boolean }>(`
    SELECT c.relname AS tablename, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `)
  for (const row of beforeRls.rows) {
    if (row.rls) {
      throw new Error(`Expected RLS disabled before migration on ${row.tablename}`)
    }
  }

  const upBlocks = extractAllSqlBlocks(migrationPath, 'up')
  console.log(`[postgrest-rls] applying ${upBlocks.length} migration SQL block(s)…`)
  for (const block of upBlocks) {
    await client.query(block)
  }

  const after = await client.query<{
    tablename: string
    rls: boolean
    force: boolean
  }>(`
    SELECT c.relname AS tablename, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `)

  if (after.rows.length === 0) {
    throw new Error('Expected public base tables after migration')
  }

  for (const row of after.rows) {
    if (!row.rls) {
      throw new Error(`Expected RLS enabled on public.${row.tablename}`)
    }
    if (row.force) {
      throw new Error(`FORCE ROW LEVEL SECURITY must not be set on public.${row.tablename}`)
    }
  }
  console.log(`[postgrest-rls] OK — RLS enabled (no FORCE) on ${after.rows.length} table(s)`)

  const tablePrivs = await client.query<{ grantee: string; count: string }>(`
    SELECT grantee, count(*)::text AS count
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
    GROUP BY grantee
  `)
  if (tablePrivs.rows.length > 0) {
    throw new Error(
      `Expected no table privileges for anon/authenticated; found: ${JSON.stringify(tablePrivs.rows)}`,
    )
  }
  console.log('[postgrest-rls] OK — anon/authenticated table privileges revoked')

  const seqPrivs = await client.query<{ grantee: string; count: string }>(`
    SELECT grantee, count(*)::text AS count
    FROM information_schema.usage_privileges
    WHERE object_schema = 'public'
      AND object_type = 'SEQUENCE'
      AND grantee IN ('anon', 'authenticated')
    GROUP BY grantee
  `)
  if (seqPrivs.rows.length > 0) {
    throw new Error(
      `Expected no sequence privileges for anon/authenticated; found: ${JSON.stringify(seqPrivs.rows)}`,
    )
  }
  console.log('[postgrest-rls] OK — anon/authenticated sequence privileges revoked')

  // Confirm FORCE is absent from the migration source as well (defense in depth).
  const source = readFileSync(migrationPath, 'utf8')
  if (/FORCE\s+ROW\s+LEVEL\s+SECURITY/i.test(source)) {
    throw new Error('Migration source must not use FORCE ROW LEVEL SECURITY')
  }

  await client.end()
  console.log('[postgrest-rls] PASS')
}

main().catch((err) => {
  console.error('[postgrest-rls] FAIL', err)
  process.exit(1)
})
