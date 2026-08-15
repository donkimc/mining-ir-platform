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

- **Commit:** `3c3ca30` (tip; hardening payload `e209229`)
- **Changed areas:** `src/lib/database-guards.ts` (TLS fail-closed; hatch removed), `src/lib/collection-hooks.ts` (public serializer), media Review denial tests, Sprint 3 public-API suite, incremental migration + storage privacy scripts, `docs/OPERATIONS.md`, ADR-0007 amendment, Sprint 2 session/N5/N1/N2 remediations committed with this release candidate.

### Commands and results (local)

| Command | Result |
| --- | --- |
| `npm run verify` | **Pass** — lint, typecheck, **70/70** tests, migration-drift, `build:ci` (observed 2026-08-15) |
| `INCREMENTAL_MIGRATION_DATABASE_URI=…/mining_ir_migrate_test npm run test:incremental-migration` | **Pass** — Sprint 2 baseline lacks `original_filename`; upgrade adds it; down removes; forward recovery re-adds |
| `npm run check:migration-drift` | **Pass** |
| Database guard unit tests | **Pass** — push=true rejected on production/Preview; `ALLOW_INSECURE_DB_SSL` ignored; Vercel requires `DATABASE_SSL_CA` |

### Vercel Preview URL and deployment commit

| Item | Status |
| --- | --- |
| Staging alias | https://mining-ir-platform.vercel.app |
| Exact Sprint 3 commit deployed | **Not verified** — blocked pending `DATABASE_SSL_CA` (see below) |

### Supabase staging project

- Project ref: `jthotkkremiesvocfsmr` (no secrets in this document)

### Migration and drift-check evidence

- Drift CI: pass (wired into `npm run verify`).
- Incremental upgrade against prior Sprint 2 schema: **Pass** on disposable DB `mining_ir_migrate_test` (see command above). This is the M3 rehearsal.

### Direct storage URL and application media-route evidence

| Check | Status |
| --- | --- |
| App-side Draft media denied | **Pass** (local + unit/int tests) |
| App-side Review media denied | **Pass** (`tests/media-access.int.spec.ts`) |
| App-side Published media allowed | **Pass** |
| Wrong-tenant media denied | **Pass** |
| Supabase bucket `public = false` | **Not verified** — dashboard login required; anonymous public path still returns Storage `NoSuchKey` JSON (bucket resolves without auth) |
| Direct-object denial for a real key | **Not verified** — needs private bucket + real uploaded object |
| Cloud upload on Preview + redeploy | **Not verified** — blocked on TLS CA + private bucket |

### Secret-rotation and session-invalidation evidence

| Check | Status |
| --- | --- |
| Procedure documented | **Pass** — `docs/OPERATIONS.md` |
| `PAYLOAD_SECRET` rotated on Vercel Preview + Production | **Pass** (2026-08-15; values not recorded here) |
| Old JWT invalid after rotate | **Not verified on live Preview** — requires redeploy with new secret; expected by Payload signing design |
| DB password / S3 keys / staging admin passwords rotated | **Not verified** — owner must rotate in Supabase + password manager (H1 remainder) |
| Secrets absent from Git | **Pass** — no secret values committed; `*.local.md` gitignored |

### TLS and production-guard evidence

| Check | Status |
| --- | --- |
| Code: Vercel requires `DATABASE_SSL_CA` | **Pass** (`src/lib/database-guards.ts` + tests) |
| Code: `ALLOW_INSECURE_DB_SSL` hatch removed | **Pass** |
| Code: push=true rejected on Preview/Production/build | **Pass** |
| `DATABASE_SSL_CA` set on Vercel | **Not verified** — Supabase dashboard login required to download project CA; RDS global bundle fails (`self-signed certificate in certificate chain`) |
| Live Preview boots with verified TLS | **Not verified** — blocked on CA |

### Backup/restore and rollback rehearsal evidence

| Check | Status |
| --- | --- |
| Runbook | **Pass** — `docs/OPERATIONS.md` |
| Migration down/up forward recovery | **Pass** — incremental migration script |
| Supabase dashboard backup restore rehearsal | **Not verified** — requires dashboard access / PITR UI |

### Production readiness

**Not Production-ready.** Critical/High infra gates remain open until:

1. Owner downloads Supabase project CA → set `DATABASE_SSL_CA` on Vercel Preview/Production → remove any remaining `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
2. Owner sets Storage bucket `media` to **private** and confirms `npm run check:storage-privacy` exits 0 for a real object key.
3. Redeploy the exact remediation commit; upload a fictional Aurora Gold file; verify app route + direct URL; confirm old sessions fail after secret rotation.

### Known limitations / deferred Sprint 4

- Investor accounts, market data, analytics, subscriptions, AI ingestion, SEDAR+, GIS, new templates — Sprint 4+ (`docs/ROADMAP.md`, ADR-0008).
- N3/N4 Low items from Sprint 2 re-review remain optional cleanup.
