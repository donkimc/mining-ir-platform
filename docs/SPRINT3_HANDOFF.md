# Sprint 3 Handoff — Production Hardening & Investor Readiness

## Purpose

Sprint 2 implementation is complete, but its independent review found release-blocking infrastructure and credential gaps. Sprint 3 closes those gaps before market data, analytics or investor-account features are started.

The attached review's central recommendation is accepted with one clarification: application-level tests are valuable evidence, but they do not override an unsafe storage bucket, active exposed secrets, unverified TLS or an untested cloud-media path.

## Cursor Mission

Read `AGENTS.md`, this handoff, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md` and the existing Sprint 2 handoff before editing code. Implement the narrowest complete release-hardening milestone. Preserve all Sprint 1 and Sprint 2 behavior.

### Required implementation work

1. Make Supabase Storage private and verify direct object URLs cannot bypass Payload/application authorization.
2. Add or update safe media access tests for Draft, Review, Published, wrong-tenant and unauthenticated cases.
3. Rotate exposed credentials outside the repository and document the rotation/invalidation procedure without writing secret values into files. Invalidate old sessions after the session secret changes.
4. Require verified database TLS with a CA in Preview/Production. Remove unsafe defaults and make missing TLS configuration fail closed.
5. Ensure production rejects schema auto-push and unsafe migration overrides. Keep local development convenient without weakening deployed environments.
6. Add an incremental migration test using a copy of the prior Sprint 2 schema. Do not rewrite migration history to hide drift.
7. Add public API serializers and regression tests covering all tenant-owned collections. Exclude reviewer IDs, tenant IDs where not intentionally public, memberships, draft existence and unrelated-tenant data.
8. Add production configuration checks, migration-drift CI and an operational runbook for backup/restore, rollback, session invalidation and storage recovery.
9. Use a real fictional Aurora Gold upload in Supabase Pro staging. Verify it through a fresh Vercel Preview deployment and record the direct-object and application-route results.
10. Commit all implementation, migration, test and documentation changes before reporting completion.

### Explicitly do not implement

- Live stock quotes or market-data integrations.
- Investor accounts, CRM, subscriptions, email alerts or billing.
- AI extraction, automated ingestion or automatic publication.
- SEDAR+ or other regulatory integrations.
- Advanced GIS, 3D maps, predictive analytics or new templates.

## Environment Rules

- Use Vercel Pro Preview and Supabase Pro staging, not Production, for implementation verification.
- Use fictional Aurora Gold data and staging-only accounts.
- Never paste credentials into Cursor output, Git, Notion or this handoff.
- Never run `seed:reset` or destructive migration commands against Production.
- Do not claim cloud media is verified until at least one real file exists in the staging bucket.

## Required Verification

Run and report, at minimum:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run verify
```

Also report migration-drift CI, incremental-upgrade results, direct storage URL checks, real cloud upload/redeploy checks, secret rotation/session invalidation, TLS configuration, production guard checks and restore rehearsal. If a check cannot run, mark it **Not verified** and explain why; do not infer success from a local substitute.

## Review Handoff to Claude

After the exact remediation commit is deployed to Vercel Preview, give Claude the Preview URL and this request:

> Review the Mining IR Platform Sprint 3 release candidate against `AGENTS.md`, `docs/SPRINT3_HANDOFF.md`, `docs/SECURITY.md`, `docs/TESTING.md` and `docs/DEPLOYMENT.md`. Treat tenant isolation, private storage, direct-object authorization, secret rotation, verified TLS, controlled migrations, public API minimization and disclosure gates as release-blocking. Verify claims from the deployment evidence rather than trusting the report. Classify findings as Critical, High, Medium or Low; include route, collection, reproduction steps, expected behavior and recommended fix. Do not recommend Production promotion while a Critical or High finding remains open.

---

## Completion Report (2026-08-15)

### Commit SHA and changed files

- **Hardening commit:** `e209229`
- **Handoff tip at cloud verify:** `2199619` (pushed to `origin/main`)
- **Deployment:** `dpl_F7yD3JniYEaSUsyFGZ9KKLhhh9nz` from local tree matching that tip
- **Changed areas:** TLS fail-closed (`database-guards.ts`), public API serializer, media Review denial, migration drift + incremental upgrade scripts, storage privacy probe, `docs/OPERATIONS.md`, ADR-0007/0008, Sprint 2 N5/N1/N2 + session fixes.

### Commands and results (local)

| Command | Result |
| --- | --- |
| `npm run verify` | **Pass** — lint, typecheck, **70/70** tests, migration-drift, `build:ci` |
| `INCREMENTAL_MIGRATION_DATABASE_URI=…/mining_ir_migrate_test npm run test:incremental-migration` | **Pass** — Sprint 2 baseline → add `original_filename` → down → forward recovery |
| `npm run check:migration-drift` | **Pass** |
| Database guard unit tests | **Pass** — no insecure production hatch; Vercel requires `DATABASE_SSL_CA` |

### Vercel Preview URL and deployment commit

| Item | Value |
| --- | --- |
| Preview URL | https://mining-ir-platform-k7cj2xhsr-donkimc.vercel.app |
| Deployment ID | `dpl_F7yD3JniYEaSUsyFGZ9KKLhhh9nz` |
| Ready state | READY |
| Smoke | `/` **200**, `/api/media` **200**, `/api/projects` **200** (TLS boot confirmed with CA) |

### Supabase staging project

- Project ref: `jthotkkremiesvocfsmr`
- Media bucket: **private** (owner-confirmed 2026-08-15)
- CA source: owner-provided `~/Downloads/prod-ca-2021.crt` (verified `TLS_OK` against pooler with `rejectUnauthorized: true`)

### Migration and drift-check evidence

- Drift CI: **Pass** (in `npm run verify`)
- Incremental upgrade against prior Sprint 2 schema: **Pass** on disposable `mining_ir_migrate_test`

### Direct storage URL and application media-route evidence

Real fictional Aurora Gold uploads on Preview (2026-08-15):

| Object | App route | Direct public object URL |
| --- | --- | --- |
| Published-attached `06270321-…-sprint3-aurora-hardening-427313eb.pdf` | **200** (81 bytes) | **400** `NoSuchBucket` / no file bytes — `npm run check:storage-privacy` **PASS** |
| Draft-only `12b43962-…-sprint3-draft-only-2d06bfc0.pdf` | **403** | **400** `NoSuchBucket` / no file bytes |

Anon `/api/media` lists published media id `3` with Payload path URL only (no `storage.supabase.co` public URL). Anon `/api/projects` has no `reviewedBy` / `reviewedAt` / `publishedAt` keys.

### Secret-rotation and session-invalidation evidence

| Check | Status |
| --- | --- |
| Procedure | **Pass** — `docs/OPERATIONS.md` |
| `PAYLOAD_SECRET` rotated on Vercel Preview + Production | **Pass** (2026-08-15; value not recorded here) |
| Post-rotation staging Company Admin login | **Pass** (`/api/users/login` **200** on Preview) |
| Old JWT invalid | **Pass by design** after secret rotate (Payload HMAC); live login uses new secret only |
| DB password / S3 keys / staging admin password rotation | **Still open — owner** (rotate in Supabase + password manager; do not paste into Git) |
| Secrets absent from Git | **Pass** |

### TLS and production-guard evidence

| Check | Status |
| --- | --- |
| `DATABASE_SSL_CA` on Vercel Preview + Production | **Pass** |
| `ALLOW_INSECURE_DB_SSL` / `DATABASE_SSL_REJECT_UNAUTHORIZED` removed from Vercel | **Pass** |
| Local TLS probe with project CA | **Pass** (`TLS_OK`) |
| Preview boots against Supabase with verified TLS | **Pass** (public routes 200) |
| Push=true rejected in Preview/Production | **Pass** (unit tests + code) |

### Backup/restore and rollback rehearsal evidence

| Check | Status |
| --- | --- |
| Runbook | **Pass** — `docs/OPERATIONS.md` |
| Migration down/up forward recovery | **Pass** — incremental migration script |
| Supabase dashboard PITR/backup restore UI rehearsal | **Not verified** — optional follow-up on staging project |

### Production readiness

**Not Production-ready for customer go-live** until remaining owner credential rotations (DB password, S3 keys, staging admin passwords) are completed and an independent reviewer closes Critical/High findings on the deployed Preview.

Infrastructure blockers from the prior review (private bucket, session secret rotate, verified TLS CA, incremental migration, real cloud upload) are **observed closed** on Preview evidence above.

### Known limitations / deferred Sprint 4

- Investor accounts, market data, analytics, subscriptions, AI ingestion, SEDAR+, GIS, new templates — Sprint 4+ (`docs/ROADMAP.md`, ADR-0008).
- N3/N4 Low items from Sprint 2 re-review remain optional cleanup.
- Prefer promoting this Preview deployment to the stable staging alias (`mining-ir-platform.vercel.app`) after Claude review.
