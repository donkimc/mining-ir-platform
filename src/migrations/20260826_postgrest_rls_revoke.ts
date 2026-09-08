import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ADR-0022 — PostgREST fail-closed layer for Payload-on-Supabase.
 *
 * Enable RLS on every base table in `public` (no FORCE — Payload's table-owner
 * connection must keep bypassing RLS). Revoke table/sequence privileges from
 * Supabase `anon` / `authenticated` so the Data API cannot read or write even
 * if a policy is later added by mistake.
 *
 * Do not encode Payload tenant/disclosure rules as RLS policies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $rls$
    DECLARE
      r record;
    BEGIN
      FOR r IN
        SELECT c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname NOT LIKE 'pg_%'
        ORDER BY c.relname
      LOOP
        EXECUTE format(
          'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
          r.tablename
        );
      END LOOP;
    END
    $rls$;
  `)

  await db.execute(sql`
    DO $revoke$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE USAGE ON SCHEMA public FROM anon';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE USAGE ON SCHEMA public FROM authenticated';
      END IF;
    END
    $revoke$;
  `)

  await db.execute(sql`
    DO $defaults$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
      END IF;
    END
    $defaults$;
  `)
}

/**
 * Down only disables RLS. It does not re-GRANT to anon/authenticated — restoring
 * PostgREST privileges would reopen the Data API surface on purpose.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $rls$
    DECLARE
      r record;
    BEGIN
      FOR r IN
        SELECT c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname NOT LIKE 'pg_%'
        ORDER BY c.relname
      LOOP
        EXECUTE format(
          'ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',
          r.tablename
        );
      END LOOP;
    END
    $rls$;
  `)
}
