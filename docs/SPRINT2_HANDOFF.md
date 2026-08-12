# Sprint 2 Implementation Handoff

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
- Migration: `src/migrations/20260812_061650_sprint2_content.ts`

### Local commands observed

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | **43/43 pass** |
| `npm run build` | Pass |
| `npm run seed:reset` | Pass — Aurora + Northern + Sprint 2 content |
| `npm run verify` | Pass (2026-08-12 remediations for C1/H2/H3) |

Local seed logins (dev only): `platform@mining-ir.local` / `ChangeMeLocal1!`, `admin@auroragold.local` / `ChangeMeLocal1!`.

### Review remediations observed (2026-08-12)

Fixed **only** C1, H2 and H3 from `docs/SPRINT2_REVIEW.md`. Medium/Low findings were not changed.

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

**Not closed in this change:** Supabase `media` bucket privacy (`public = false`) is the owner’s out-of-band task. Confirm separately on staging; until then direct public object URLs may still bypass the app.

#### H2 — schema push opt-in — **fixed (observed)**

- `push` is now `PAYLOAD_DATABASE_PUSH === 'true'` (missing var = off).
- Runtime hard-fail when push is enabled and `NODE_ENV === 'production'` (skipped only during Next `phase-production-build` so `npm run build` can still load config).
- `.env.example`, README, ADR-0007 updated. Local `.env.local` sets `PAYLOAD_DATABASE_PUSH=true`.

#### H3 — DB TLS CA pinning — **fixed (observed in code/docs)**

- Prefer `DATABASE_SSL_CA` → `ssl: { ca, rejectUnauthorized: true }`.
- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` only when `NODE_ENV !== 'production'` (runtime), with a console warning; production runtime hard-fails and requires CA.
- Documented in ADR-0007 / `.env.example` / README. Preview must set `DATABASE_SSL_CA` before relying on production-mode runtime.
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
| Vercel Preview URL | **Pass** — https://mining-ir-platform-apmjvq9hy-donkimc.vercel.app (deployment `dpl_7dBmvtN8tjeYVrxEQ8TMRX1UwnKn`, project `mining-ir-platform`) |
| Supabase staging project | **Pass** — ref `jthotkkremiesvocfsmr` (pooler `aws-0-ap-southeast-1.pooler.supabase.com:6543`); Storage bucket `media` |
| Migration | **Pass** — `20260812_061650_sprint2_content` applied on staging |
| Seed | **Pass** — fictional Aurora + Northern fixtures; staging seed emails only (not committed) |
| Preview env | **Pass** — `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DEFAULT_TENANT_SLUG=aurora-gold`, `PAYLOAD_DATABASE_PUSH=false`, `DATABASE_SSL_REJECT_UNAUTHORIZED=false`, `S3_*` |
| Local verification | Pass — lint, typecheck, **43** tests, build, seed:reset; C1/H2/H3 remediations recorded above |

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
2. Staging: set `PAYLOAD_DATABASE_PUSH=false`, configure `DATABASE_URI` to Supabase pooler, run `npm run migrate`.
3. Seed staging with `npm run seed` only (never Production `seed:reset`).

### Known limitations

1. Preview deployment URLs are ephemeral; `NEXT_PUBLIC_SERVER_URL` must track the URL under review until a stable staging domain exists.
2. Investment highlights / catalysts can still be created directly as Published (Sprint 1 homepage helpers).
3. Investors/Corporate remain placeholders.
4. Production deploy was not promoted; gate Production after Claude review of Preview.

### Deferred work

- Stable staging hostname / custom domain and Production promotion after review.
- Hostname-based multi-tenant routing beyond `DEFAULT_TENANT_SLUG` on platform hosts.

## Claude Review Focus

Review tenant isolation, cross-tenant relationships, Published-only public reads, review-gated edits, forged review metadata, source-link safety, responsive content pages, accessibility, Sprint 1 regressions and the deployed Vercel Preview. Test the actual staging URL and confirm that Preview environment variables point to Supabase Pro rather than local services. Findings must include severity, file/line or URL references and recommended fixes.

**Review packet (credentials + copy-paste Claude prompt):** `docs/SPRINT2_CLAUDE_REVIEW.local.md` (gitignored). Do not commit that file.
