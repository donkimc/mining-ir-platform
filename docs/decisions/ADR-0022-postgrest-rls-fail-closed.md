# ADR-0022: PostgREST Fail-Closed for Payload-on-Supabase

## Status

Accepted — 2026-08-26 (remediation for Supabase database linter `rls_disabled_in_public`).

## Context

The app uses PostgreSQL hosted on Supabase through `@payloadcms/db-postgres` and `DATABASE_URI`.
Authorization, tenant isolation and Published-only public reads are enforced in **Payload**
(collection access, serializers, host-based tenant resolution) — not via Supabase Auth JWTs.

Supabase still exposes the `public` schema through PostgREST. Tables without row level security
trigger linter ERROR `rls_disabled_in_public`. If `anon` / `authenticated` retain table privileges,
the Data API can bypass Payload entirely.

## Decision

1. Postgres is an application database for Payload. The Supabase **Data API (PostgREST) is not a
   public product API** for this system.
2. Enable **ROW LEVEL SECURITY** on every base table in `public`. Do **not** use
   `FORCE ROW LEVEL SECURITY` — the Payload connection runs as the table owner and must keep
   bypassing RLS.
3. **`REVOKE ALL`** on `public` tables and sequences from Supabase roles `anon` and
   `authenticated`. Adjust default privileges so future tables created by the same owner do not
   silently re-grant those roles.
4. Do **not** encode Payload tenant membership, disclosure status or provenance rules as RLS
   policies. That would duplicate (and drift from) the real authorization boundary.
5. Ship the change as a checked-in Payload migration (`20260826_postgrest_rls_revoke`) applied with
   `PAYLOAD_DATABASE_PUSH=false npm run migrate` on each environment. Never `seed:reset` Production.

## Consequences

- Supabase linter `rls_disabled_in_public` should clear after migrate on that project.
- Direct REST calls with the anon key must fail or return no rows; app routes via Payload must
  continue to work.
- New collections still need this class of protection: the migration loops all current `public`
  base tables; a later additive migration (or re-run of the same revoke/default-privilege pattern)
  is required if tables are created outside that migration and somehow receive grants.
- `service_role` remains a privileged secret and must never be exposed to browsers.

## Verification

1. Apply migration on staging, then Production.
2. Confirm RLS enabled:  
   `select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r';`
3. With the project anon key: `GET /rest/v1/companies?select=id` must not return tenant rows.
4. Smoke a published tenant host and an authenticated dashboard path after migrate.
5. **Disposable-database rehearsal (preferred automated evidence):**  
   `POSTGREST_RLS_DATABASE_URI=postgres://…/disposable npm run test:postgrest-rls`  
   Asserts RLS enabled (no FORCE) on public base tables and that `anon` / `authenticated`
   table and sequence privileges are revoked. Static string checks in
   `tests/postgrest-rls-migration.spec.ts` remain as a cheap CI guard; they are not a
   substitute for the DB-backed script.
