# ADR-0007: Supabase Storage and Controlled Migrations

## Status

Accepted for Sprint 2 (amended 2026-08-12 for C1/H2/H3)

## Decision

Use Supabase Storage (S3-compatible API) for Payload media and document uploads in staging and production via `@payloadcms/storage-s3`. Local development may continue to use the filesystem when storage environment variables are absent.

The Supabase `media` bucket must be **private**. Application code must not emit public object URLs (`/storage/v1/object/public/...`). Files are served only through Payload (`/api/media/file/<randomized-name>`) so `Media.access.read` applies. Anonymous reads require the media to be referenced by a **Published** Document (`file`) or Person (`headshot`) on a published, active tenant. Stored object keys are UUID-prefixed; `originalFilename` retains the display name.

Use controlled Payload Postgres migrations for shared staging/production databases. Schema push is **opt-in only**: `PAYLOAD_DATABASE_PUSH === 'true'`. A missing variable means push is off. Push is hard-rejected at runtime when `NODE_ENV === 'production'` (Next.js `phase-production-build` is excluded so `next build` can import config with a local opt-in still set).

Database TLS: prefer `DATABASE_SSL_CA` (PEM) and `ssl: { ca, rejectUnauthorized: true }`. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is allowed only at non-production runtime and logs a warning; production runtime must use CA pinning.

Do not add Amazon S3 as a separate provider or a second database product for Sprint 2.

## Consequences

Preview deployments require Supabase Storage credentials, a **private** media bucket, a migrated staging database, and `DATABASE_SSL_CA` (or non-production insecure TLS for local only). Media bytes are not publicly addressable by guessed filenames once the bucket is private and access checks are enforced. Schema changes must be committed as migrations before staging seed/deploy.
