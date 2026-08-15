# Operations Runbook — Mining IR Platform

Operational procedures for staging and production. Never paste secret values into this document, Git, Notion or chat logs.

## Roles

| Role | Responsibility |
| --- | --- |
| Product Director | Accept residual risk; approve Production promotion |
| Platform Admin (engineering) | Deploy Preview/Production, rotate secrets, run migrations |
| On-call / owner | Incident response, restore rehearsal, storage recovery |

## Environments

| Class | Hosting | Database | Notes |
| --- | --- | --- | --- |
| Local | `next dev` | Local Postgres | `PAYLOAD_DATABASE_PUSH=true` allowed |
| Staging / Preview | Vercel Preview (or staging alias) | Supabase Pro staging | `PAYLOAD_DATABASE_PUSH=false`; `DATABASE_SSL_CA` required |
| Production | Vercel Production | Supabase Pro production | Same guards; fictional data only until go-live |

Never run `seed:reset` or destructive migration tests against Production.

## Secret rotation and session invalidation

Rotate any credential that appeared in review packets, chat, logs or shared docs.

1. Generate a new high-entropy `PAYLOAD_SECRET` (32+ bytes random).
2. Set it in Vercel Preview (and Production only when promoting) via the Vercel dashboard or CLI — do not commit the value.
3. Redeploy so all serverless instances load the new secret.
4. **Old sessions are invalid immediately** because Payload JWTs are signed with `PAYLOAD_SECRET`. Verify by:
   - Keeping an existing `payload-token` cookie from before rotation
   - Requesting `/dashboard` — expect redirect to `/login`
   - Logging in again with a staging account — expect success
5. Rotate in the same change window, as needed: Supabase database password, Storage S3 access keys, staging admin passwords.
6. Update local password manager / `.env.staging.local` (gitignored) only. Confirm `git grep` and CI logs show no secret material.
7. After rotation, destroy or redact any local review packets that contained the old values (`docs/*.local.md`).

## Database TLS

- Preview and Production **require** `DATABASE_SSL_CA` (Supabase project CA PEM from Dashboard → Database → SSL).
- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is rejected in Preview/Production (Sprint 3 removed `ALLOW_INSECURE_DB_SSL`).
- Local development may omit SSL against localhost.

## Schema push and migrations

- Production/Preview: `PAYLOAD_DATABASE_PUSH=false`. Push enabled in those environments throws at startup.
- After collection schema changes: `npm run migrate:create`, review additive SQL, commit migration files, apply with `npm run migrate` on staging.
- CI: `npm run check:migration-drift` (wired into `npm run verify`).
- Incremental upgrade rehearsal: `INCREMENTAL_MIGRATION_DATABASE_URI=… npm run test:incremental-migration` against a disposable database only.

## Backup and restore (Supabase)

### Backup

- Supabase Pro includes automated daily backups / PITR per plan. Confirm retention in the Supabase dashboard before go-live.
- Before risky migrations: create a manual backup or snapshot note (project ref, timestamp, migration name about to apply).

### Restore rehearsal (non-production)

1. Choose the staging project (never Production).
2. From Supabase Dashboard → Database → Backups, restore to a point before a test change, **or** restore into a fresh branch/project if available on the plan.
3. Re-run `npm run migrate` if the restored schema is behind the app.
4. Smoke: public `/`, Company Admin login, one Published media file via `/api/media/file/…`.
5. Record date, project ref, restore method and smoke result in the Sprint handoff.

### Release rollback

1. On Vercel, promote/redeploy the previous known-good deployment (instant rollback of app code).
2. If a migration is incompatible with the previous app: either forward-fix with a new migration, or restore the database backup taken before the migration (staging first).
3. Do not “fix” Production by enabling `PAYLOAD_DATABASE_PUSH`.

## Storage recovery

- Bucket `media` must remain **private**. Application serves files only via `/api/media/file/<key>`.
- Probe: `STORAGE_PROBE_OBJECT_KEY=<filename> npm run check:storage-privacy` — must exit 0 (no anonymous bytes).
- If a file is lost from Storage but DB rows remain: re-upload via Company Admin dashboard and re-link the Document/Person; do not invent public URLs.
- If the bucket was accidentally set public: set `public = false` immediately, rotate S3 keys if exposure is suspected, re-run the privacy probe and C1 media checks.

## Incident response (short)

1. Contain: disable public bucket access; rotate exposed secrets; take Preview offline via Vercel if needed.
2. Assess: which tenants/data/paths were reachable; preserve logs.
3. Eradicate: patch, migrate, redeploy exact commit; invalidate sessions via `PAYLOAD_SECRET` rotation.
4. Recover: restore rehearsal path; confirm disclosure gates and media AC.
5. Notify Product Director; update SECURITY.md / handoff with non-secret evidence.

## Logs and alerts

- Vercel: deployment and runtime logs for the Preview/Production projects.
- Supabase: database and storage logs for the staging/production projects.
- Owner: Product Director assigns who watches failed deploys and auth error spikes.

## Related docs

- [SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ADR-0007](./decisions/ADR-0007-supabase-storage-and-migrations.md)
- [ADR-0008](./decisions/ADR-0008-production-readiness-gates-before-investor-features.md)
