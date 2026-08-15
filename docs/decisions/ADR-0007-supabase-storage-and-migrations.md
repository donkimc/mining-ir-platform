# ADR-0007: Supabase Storage and Controlled Migrations

## Status

Accepted for Sprint 2 (amended 2026-08-12 for C1/H2/H3/N2/N5; amended 2026-08-15 for Sprint 3 TLS fail-closed)

## Decision

Use Supabase Storage (S3-compatible API) for Payload media and document uploads in staging and production via `@payloadcms/storage-s3`. Local development may continue to use the filesystem when storage environment variables are absent.

The Supabase `media` bucket must be **private**. Application code must not emit public object URLs (`/storage/v1/object/public/...`). Files are served only through Payload (`/api/media/file/<randomized-name>`) so `Media.access.read` applies. Anonymous reads require the media to be referenced by a **Published** Document (`file`) or Person (`headshot`) on a published, active tenant. Stored object keys are UUID-prefixed; `originalFilename` retains the display name. Verify privacy with `npm run check:storage-privacy` against a real object key.

Use controlled Payload Postgres migrations for shared staging/production databases. Schema push is **opt-in only**: `PAYLOAD_DATABASE_PUSH === 'true'`. A missing variable means push is off. Push is hard-rejected whenever `NODE_ENV === 'production'` or on Vercel Preview/Production, **including** Next.js `phase-production-build`. Builds must run with `PAYLOAD_DATABASE_PUSH=false` (see `npm run build:ci`). During the build phase, `push` is also forced off so schema cannot mutate at build time even if a misconfigured environment somehow bypasses the throw.

**Schema changes require a generated migration in the same commit.** After changing collections, run `npm run migrate:create`, review that the SQL is additive for shared environments, commit the new `src/migrations/*` files, and apply with `npm run migrate` where `push` is disabled. `npm run check:migration-drift` / `npm run verify` fail when collection fields are missing from the latest migration snapshot (this is how the `media.originalFilename` staging outage is prevented). Rehearse upgrades with `npm run test:incremental-migration` against a disposable database created from the prior Sprint 2 schema.

Database TLS: Preview and Production **require** `DATABASE_SSL_CA` (PEM from the Supabase project Database → SSL settings — not an AWS RDS regional bundle) with `ssl: { ca, rejectUnauthorized: true }`. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is allowed only for local/non-Vercel development and logs a warning.

**Sprint 3:** The `ALLOW_INSECURE_DB_SSL` staging hatch is **removed**. Setting it has no effect. Missing `DATABASE_SSL_CA` on Vercel fails closed at startup.

Do not add Amazon S3 as a separate provider or a second database product for Sprint 2/3.

## Consequences

Preview/Production deployments require Supabase Storage credentials, a **private** media bucket, a migrated staging database, and `DATABASE_SSL_CA`. Media bytes are not publicly addressable by guessed filenames once the bucket is private and access checks are enforced. Schema changes must be committed as migrations in the same change set before staging seed/deploy; drift CI and incremental-migration rehearsal enforce that local `push` cannot paper over missing migrations. See `docs/OPERATIONS.md` for rotation, restore and storage recovery.
