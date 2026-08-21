# Sprint 2 Implementation Handoff

> Historical terminology note: this document predates the Sprint 6 fixture identity rename. Quoted Aurora Gold/Northern Copper names, poison strings and slugs refer to retired fictional test fixtures and are preserved as historical evidence; they are not current tenants or Production identities.

Cursor should read `AGENTS.md` and all files under `docs/` before implementation. Sprint 1 is the working baseline; preserve its routes, auth model, tenant isolation and tests.

## Goal

Deliver structured mining content workflows for News, Documents/Presentations, Management, Share Structure and Exploration Content, with review-gated publication and public Explorer rendering.

## Implementation status (local)

Sprint 2 mining-content code is implemented on the Sprint 1 baseline:

- Collections: `news-releases`, `documents`, `people`, `share-structures` (upgraded), `exploration-contents`
- Shared helpers: disclosure lists, source-reference gate, forged review-metadata strip, same-tenant relation checks
- Company Admin CRUD + status-only approval for all five types
- Public Explorer: `/news`, `/news/[slug]`, `/documents`, `/management`, `/share-structure`, exploration on `/projects/[slug]`
- Seed: fictional Aurora published + draft fixtures; Northern Copper isolation fixtures
- ADR-0007: Supabase Storage + controlled migrations
- Migration: `src/migrations/20260812_061650_sprint2_content.ts` + `20260812_132324_media_original_filename.ts`

### Local commands observed

| Command | Result |
| --- | --- |
| `npm run lint` | Pass (migration unused-arg warnings cleared) |
| `npm run typecheck` | Pass |
| `npm test` | **57/57 pass** (observed 2026-08-15 N5/N1/N2 re-verify; includes drift, guards, auth-cookie specs) |
| `npm run check:migration-drift` | Pass |
| `npm run build` / `npm run build:ci` | Pass (`PAYLOAD_DATABASE_PUSH=false`) |
| `npm run seed:reset` | Pass — Aurora + Northern + Sprint 2 content |
| `npm run verify` | Pass — lint + typecheck + test + drift + build:ci (observed 2026-08-15) |

Local seed logins (dev only): emails and passwords come from the `SEED_*` variables in your gitignored `.env.local`. Literal credentials are no longer published in this repository — see `README.md`.

### Review remediations observed (2026-08-12; re-verified 2026-08-15)

C1, H2 and H3 were fixed earlier. Medium findings M4, M1, M2, M5 and Low L1+ are remediations in subsequent commits (see git log).

#### N5 / N1 / N2 re-review fixes (2026-08-12, second pass) — **fixed (re-verified 2026-08-15)**

- **N5:** Added migration `20260812_132324_media_original_filename` (`ALTER TABLE media ADD COLUMN original_filename`). Applied cleanly to a Sprint 2 schema without the column (local simulation + staging Supabase). Added `npm run check:migration-drift` wired into `npm run verify`. ADR-0007 now requires migrations in the same commit as schema changes.
- **N1:** `Projects`, `InvestmentHighlights`, `Catalysts` use `publishedOnlyOrTenantScopedRead()` + `stripReviewMetadataAfterRead`. `Companies` strips review metadata for anonymous callers (multi-tenant listing retained for Platform Admin / published company directory). Seeded Northern Copper `NORTHERN SECRET` investment highlight as the isolation fixture.
- **N2:** Production push/SSL guards no longer waive during `phase-production-build`. `push` is forced off during build; `PAYLOAD_DATABASE_PUSH=true` + `NODE_ENV=production` always throws. **Kept** `ALLOW_INSECURE_DB_SSL=true` as a staging-only TLS hatch with warning log and **expiry 2026-09-30** (recorded in ADR-0007).

**Local anon API smoke (observed 2026-08-15 on `next dev`):** `/api/projects`, `/api/investment-highlights`, `/api/catalysts` → tenant `11` only, no `reviewedBy`/`reviewedAt`/`publishedAt` keys; `/api/companies` → company ids `11`+`12`, review keys absent; `/api/media` → **200** (1 published Aurora file). DB still has Northern Copper highlight id `17` (`NORTHERN SECRET`, tenant `12`, published) — absent from anon list.

#### Session kick-out fix — **preserved (do not regress)**

Authenticated dashboard/admin menu navigations must keep the Payload session. Keep these together:

- `FullPageNavLink` (full document `<a>`) in dashboard + admin layouts — not Next soft `<Link>` for auth chrome
- `getAuthHeaders()` reads `payload-token` from `cookies()` and sets `Authorization: JWT …`
- Login via `POST /api/users/login` + `window.location.href` hard navigation
- Cookie `secure` only when `VERCEL === '1'` / protocol-aware helpers in `auth-cookies.ts`

#### C1 — media access (application side) — **partially remediates; bucket privacy still open**
App changes (observed):

- `Media.access.read` for anonymous users requires a **Published** Document `file` or Person `headshot` on a published active tenant (tenant publication alone is not enough).
- Uploaded object keys are UUID-prefixed; `originalFilename` keeps the display name.
- File URLs are Payload paths (`/api/media/file/...`). `generateFileURL` does not emit public Supabase object URLs. Repo grep shows no code constructing `/storage/v1/object/public/`.

**Tests before fix** (`tests/media-access.int.spec.ts`): 2 failed / 2 passed — anonymous draft media still readable; filename not randomized.

**Tests after fix:** 4/4 passed.

**Local HTTP smoke** (`next start` on `127.0.0.1:3000`):

| Step | Result |
| --- | --- |
| Upload `smoke-draft.pdf` | Stored as `43ffc47a-…-smoke-draft.pdf`; `url` = `/api/media/file/…`; no `storage.supabase.co` |
| Anonymous `GET /api/media/file/<name>` while Document is Draft | **403** |
| Same URL after Document Draft → Review → Published | **200** |

**Re-verified 2026-08-15 (`next dev`):** seed published file → **200**; draft-attached file → **403**; anon `GET /api/media/95` (draft) → **404**; disclosure + isolation + media suites **48/48**.

**Not closed in this change:** Supabase `media` bucket privacy (`public = false`) is the owner’s out-of-band task. Confirm separately on staging; until then direct public object URLs may still bypass the app.

#### H2 — schema push opt-in — **fixed (observed; tightened by N2)**

- `push` is now `PAYLOAD_DATABASE_PUSH === 'true'` (missing var = off).
- Hard-fail when push is enabled and `NODE_ENV === 'production'` **including** Next `phase-production-build` (N2). Use `npm run build:ci` / `PAYLOAD_DATABASE_PUSH=false` for production builds.
- `.env.example`, README, ADR-0007 updated. Local `.env.local` sets `PAYLOAD_DATABASE_PUSH=true`.

#### H3 — DB TLS CA pinning — **fixed (observed in code/docs; staging hatch kept)**

- Prefer `DATABASE_SSL_CA` → `ssl: { ca, rejectUnauthorized: true }`.
- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is not waived during the Next build phase (N2).
- Staging may set `ALLOW_INSECURE_DB_SSL=true` until **2026-09-30** (ADR-0007); then require CA.
- Owner still needs to install the Supabase project CA on Preview/Production and remove the hatch.
## Cloud Staging Requirement

The owner has an active Vercel Pro subscription and an active Supabase Pro subscription. Sprint 2 is not complete until the implementation works in a cloud staging/Preview environment.

Use Supabase Pro for the hosted PostgreSQL database and, unless an explicit decision is recorded, Supabase Storage for Payload media. Do not create a second database subscription through Vercel or add Amazon S3 for Sprint 2 without documenting why.

### Cursor Cloud Deployment Tasks

- Connect the repository to Vercel and configure the project with the correct root directory.
- Create separate Preview and Production environment variables in Vercel.
- Create a Supabase Pro project/database for staging.
- Use a pooled Supabase connection for Vercel runtime traffic and a safe migration connection for schema operations.
- Replace local-only `push: true` behavior with a controlled migration or clearly documented staging migration command before using shared data.
- Configure a strong staging `PAYLOAD_SECRET`; never reuse local secrets or seed passwords.
- Configure `NEXT_PUBLIC_SERVER_URL` to the Vercel Preview URL.
- Set `DEFAULT_TENANT_SLUG=aurora-gold` only for the staging demo unless hostname-based tenant routing is ready.
- Configure persistent media storage. Vercel's local filesystem must not be treated as permanent storage.
- Seed only fictional Aurora Gold and test data into staging. Never run `seed:reset` against production.
- Deploy a Preview and record its URL, commit, environment, database project, migration result and seed result.

### Required Staging Variables

At minimum, configure `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DEFAULT_TENANT_SLUG`, `PAYLOAD_DATABASE_PUSH=false`, and Supabase Storage `S3_*` variables. Keep Platform Admin and Company Admin credentials in a secure password manager; do not paste them into this document or commit them.

### Staging verification results

| Item | Status |
| --- | --- |
| Vercel Preview URL | **Pass** — https://mining-ir-platform.vercel.app (stable production alias used as staging; supersedes stale `…-apmjvq9hy-…` deployment) |
| Supabase staging project | **Pass** — ref `jthotkkremiesvocfsmr` (pooler `aws-0-ap-southeast-1.pooler.supabase.com:6543`); Storage bucket `media` |
| Migration | **Pass** — `20260812_061650_sprint2_content` + `20260812_132324_media_original_filename` applied on staging |
| Seed | **Pass** — fictional Aurora + Northern fixtures; staging seed emails only (not committed) |
| Preview env | **Pass** — `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DEFAULT_TENANT_SLUG=aurora-gold`, `PAYLOAD_DATABASE_PUSH=false`, `DATABASE_SSL_REJECT_UNAUTHORIZED=false`, `ALLOW_INSECURE_DB_SSL=true` (expires 2026-09-30), `S3_*` |
| Local verification | Pass — lint, typecheck, **57** tests, drift check, build:ci (re-verified 2026-08-15); N5/N1/N2 + session fix preserved |

**Preview smoke (2026-08-12):**

| Check | Result |
| --- | --- |
| `/`, `/projects`, `/news`, `/documents`, `/management`, `/share-structure` | 200, Aurora Gold published content |
| `/login` | 200 |
| Company Admin login (`admin@auroragold.staging`) | **Pass** — `/api/users/login` 200 + `/dashboard` 200 with news nav |
| `/dashboard`, `/admin/tenants` (unauthenticated) | 307 → `/login` |
| Cross-tenant leak on public pages | **Pass** — no Northern Copper content on public Explorer routes |
| Tenant resolution on `*.vercel.app` | Fixed — platform hosts use `DEFAULT_TENANT_SLUG` (not first hostname label) |
| Vercel Authentication (SSO) | Disabled on the project so Preview is publicly reviewable |

**Notes**

- Each `vercel deploy` creates a new `*.vercel.app` URL; keep Preview `NEXT_PUBLIC_SERVER_URL` aligned with the deployment under review, or use a stable alias later.
- Staging admin passwords live in a password manager / local `.env.staging.local` only — rotate any token or secret that was pasted into chat.

### Staging Verification Before Claude Review

- Public Explorer pages load from the Preview URL.
- Public Draft, Review and Archived content remains hidden.
- Company Admin login and dashboard writes work remotely.
- Platform Admin routes remain separate and protected.
- Wrong-tenant reads, writes and related-record assignments are rejected.
- News, Documents, Management, Share Structure and Exploration workflows work remotely.
- Media/document links work after a new deployment.
- `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- No local credentials, local database URLs or localhost URLs are used by the Preview deployment.

## Must Verify

- Wrong-tenant reads, writes and relationships are rejected.
- Public pages never expose Draft, Review or Archived content.
- Published disclosure-sensitive content cannot be silently changed.
- Approval cannot change content and status in the same request.
- Reviewer identity and timestamp are server-derived.
- Source links/documents are present for material mining claims.
- Sprint 1 tests and routes remain green.

## Cursor Report

### Changed areas

- Collections, publishing helpers, dashboard routes for five content types, public Explorer pages, seed, tests, ADR-0007, migrations, README/docs.

### Database / migration steps

1. Local: `PAYLOAD_DATABASE_PUSH=true` (default) pushes schema.
2. Staging: set `PAYLOAD_DATABASE_PUSH=false`, configure `DATABASE_URI` to Supabase pooler, run `npm run migrate` (includes `media.original_filename`).
3. After any collection schema change: `npm run migrate:create` in the **same commit**, then `npm run check:migration-drift`.
4. Seed staging with `npm run seed` only (never Production `seed:reset`).

### Known limitations

1. Staging currently uses the Vercel production alias `https://mining-ir-platform.vercel.app`; keep `NEXT_PUBLIC_SERVER_URL` aligned.
2. Investment highlights / catalysts can still be created directly as Published (Sprint 1 homepage helpers).
3. Investors/Corporate remain placeholders.
4. Owner actions still open: C1 bucket privacy, H1 secret rotation, H3 Supabase CA on Preview (remove `ALLOW_INSECURE_DB_SSL` by 2026-09-30), M3 incremental migration before real Production.

### Deferred work

- Stable staging hostname / custom domain and Production promotion after review.
- Hostname-based multi-tenant routing beyond `DEFAULT_TENANT_SLUG` on platform hosts.

## Claude Review Focus

Review tenant isolation, cross-tenant relationships, Published-only public reads, review-gated edits, forged review metadata, source-link safety, responsive content pages, accessibility, Sprint 1 regressions and the deployed Vercel Preview. Test the actual staging URL and confirm that Preview environment variables point to Supabase Pro rather than local services. Findings must include severity, file/line or URL references and recommended fixes.

**Review packet (credentials + copy-paste Claude prompt):** `docs/SPRINT2_CLAUDE_REVIEW.local.md` (gitignored). Do not commit that file.
