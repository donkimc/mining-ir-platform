# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mining IR Platform is a self-service, multi-tenant SaaS for junior mining companies to host investor relations websites. It's production-live since Sprint 6 on nrlaunch.com with three fictional tenants. Sprints 1–6 are complete and independently reviewed. The primary contract is in `AGENTS.md` — when code and documentation disagree, that document takes precedence.

**Key status:** Live on nrlaunch.com with conditional Ship status from Sprint 6 review. Four open Medium/Low findings carry into Sprint 7 (see `AGENTS.md` and `docs/SPRINT6_REVIEW.md`). Critical path: tenant isolation, private storage, session boundaries, publication workflow and database security must never be compromised.

## Common Development Commands

**Setup:**
```bash
npm install
cp .env.example .env.local
# Edit .env.local: DATABASE_URI, PAYLOAD_SECRET, etc.
createdb mining_ir
npm run seed
npm run dev
```

**Build and verify:**
```bash
npm run lint                    # ESLint
npm run typecheck              # TypeScript --noEmit
npm test                       # Vitest unit + integration tests
npm run test:watch             # Continuous test mode
npm run verify                 # Full release gate: lint + typecheck + test + migration-drift + build:ci
npm run build                  # Production build (required — server actions fail if not run)
npm run build:ci               # CI build (PAYLOAD_DATABASE_PUSH=false, larger heap)
```

**Database and seeds:**
```bash
npm run migrate                # Run Payload migrations (for Preview/Prod where PAYLOAD_DATABASE_PUSH=false)
npm run migrate:create         # Generate a migration from schema changes
npm run seed                   # Seed Qelvarion Resource + local admin test users
npm run seed:reset             # Full reset (local/staging only — never Production)
npm run check:migration-drift  # Fail if a collection field lacks a migration
```

**Code generation and checks:**
```bash
npm run generate:types         # Regenerate src/payload-types.ts (run after collection changes)
npm run generate:importmap     # Regenerate Payload import map
npm run check:env              # Report required env vars per environment
npm run check:storage-privacy  # Probe Supabase Storage bucket privacy (requires S3_* vars)
npm run test:incremental-migration  # Rehearse migrations on a disposable database
```

**Run a single test:**
```bash
npm test -- tests/tenant-isolation.int.spec.ts
npm run test:watch -- tests/tenant-isolation.int.spec.ts
```

## Architecture and Key Patterns

**Technology Stack:**
- Next.js 15.4, React 19, TypeScript, Tailwind CSS 4
- Payload CMS 3.87 for content/auth (Postgres adapter, push disabled in prod)
- PostgreSQL 14+ (local) / Supabase (cloud)
- Supabase Storage (S3-compatible) for private media, accessed via `/api/media/file/*`

**Multi-Tenant Isolation (non-negotiable):**
- Tenant resolved from **hostname** only; never a fallback (`DEFAULT_TENANT_SLUG` local/dev only)
- Verified in `src/lib/host.ts`; production hosts fail-closed on unknown subdomains
- All queries and mutations filter by tenant server-side; never fetch broad and filter in React
- Production cutover verified: Qelvarion is `id 1` live, `id 24` locally
- See ADR-0016 (hostname routing), ADR-0018 (admin-host session boundary)

**Route Groups:**
- `(frontend)` → public Explorer, Company Admin dashboard, Platform Admin routes
- `(payload)` → Payload CMS UI at `/cms` (Platform Admin only)
- Public: `/`, `/projects`, `/projects/[slug]`, `/news`, `/documents`, `/management`, `/share-structure`
- Company Admin: `/dashboard/*`, `/login`, `/logout`
- Platform Admin: `/admin/tenants`, `/admin/users`, `/cms`
- Authenticated routes live on admin host only; tenant hosts redirect to it

**Authentication and Authorization:**
- Auth via Payload Users collection + `payload-token` cookie
- Platform Admin identified by `users.platformRole`
- Company Admin identified by `tenant-memberships.role = company_admin`
- Single active tenant membership per Company Admin session (via `src/lib/auth.ts`)
- Session cookies are host-only (no parent-domain `Domain=` attribute)
- See `src/lib/auth.ts`, `src/lib/auth-cookies.ts`

**Publishing Workflow (disclosure-sensitive content):**
- Content exists in Draft → Review → Published states
- Disclosure-sensitive fields lock against edit once Published (ADR-0008)
- Approval is a separate status-only transition (server action, not content edit)
- Public queries filter to `Published` only; never expose `Draft`, `Review`, `reviewedBy`, `reviewedAt`
- See `src/lib/publishing.ts`, `src/lib/collection-hooks.ts`

**Collections (Payload):**
- Tenant-owned: Companies, Projects, NewsReleases, Documents, People, ShareStructures, ExplorationContents, CompanyListings, Media, Catalysts, InvestmentHighlights
- Platform-level: Users, TenantMemberships
- Every tenant-owned collection has `tenant` field, `status` (Draft/Review/Published), access controls, and hooks for publication/disclosure protection
- See `src/collections/` directory

**Server Actions and Mutations:**
- Dashboard mutations use `'use server'` with explicit async exports only
- `npm run build` verifies all server actions export async functions (test: `use-server-exports.spec.ts`)
- Validate input via Zod schemas in `src/lib/schemas/`; fail closed on bad input
- Tenant scoping is server-side only; extract from authenticated session, never from request params
- See `src/lib/dashboard-crud.ts`

**Public API and Serialization:**
- Anonymous responses use `serializeForAnonymousAccess()` from `src/lib/public-data.ts`
- Strips: `reviewedBy`, `reviewedAt`, `publishedAt`, `tenant`, `websiteDomain`, `subdomain`, `templateKey`
- All collections with custom `afterRead` must compose (not replace) this serializer
- Non-published records return not-found or are excluded from lists (ADR-0011)

**Media and Storage:**
- Local filesystem by default; Supabase Storage (S3-compatible) when `S3_*` env vars set
- Media files use UUID keys in `mediaObjectKey` field (see `src/lib/media-object-key.ts`)
- Published records only: anonymous access via `/api/media/file/:key` with 301 redirect to signed URL
- Draft/Review files must be accessed via dashboard form (server-side authorization)
- Private bucket enforced: direct Supabase URLs return 400/403 per `check:storage-privacy`
- See ADR-0007

**Database Security:**
- Local: `PAYLOAD_DATABASE_PUSH=true` for schema sync; CI/Preview/Prod: `PAYLOAD_DATABASE_PUSH=false`
- Postgres adapter runs migrations via `npm run migrate`; fatal if migration lags schema changes
- See `check:migration-drift` test
- TLS required on Preview/Prod: `DATABASE_SSL_CA` (PEM) required; `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is dev-only with logged warning
- PostgREST RLS: fail-closed with `anon`/`authenticated` roles revoked (ADR-0022)
- See `src/lib/database-guards.ts`

**Presentation Templates:**
- `explorer` (primary) and `summit` are colour-token variants, not distinct shells
- Template reuses: tenant resolution, published helpers, serializers, disclosure gate, media auth
- Unknown `templateKey` fails closed
- See ADR-0017

**Fixture Tenants (for tests and demos):**
- Qelvarion Resource (`qelvarion-resource`): explorer template, primary demo
- Veylithra Tungsten (`veylithra-tungsten`): summit template
- Zenthoriq Resource (`zenthoriq-resource`): isolation/poison test fixture (must NOT appear on live frontend)
- Fixture names are coined and registry-checked; `npm run check:retired-fixtures` guards identity stability
- See ADR-0021

## Critical Guardrails

**Never do these (production and staging):**
- Rely on `DEFAULT_TENANT_SLUG` on production-like hosts; it's local/dev only
- Fetch broad collections in React and filter by tenant; always filter at query time
- Expose `reviewedBy`, `reviewedAt`, `publishedAt`, `tenant`, `templateKey` in anonymous responses
- Disable `PAYLOAD_DATABASE_PUSH` on local dev; it must stay `true` for fast schema iteration
- Run `npm run seed:reset` against Production
- Use `npm run dev` to verify server actions; always run `npm run build` (test: `use-server-exports.spec.ts`)
- Store credentials in Git, `.env.local` (gitignored), Notion, logs or build output; rotate any that leak
- Trust client-side tenant resolution; extract tenant from authenticated session server-side only

**Must verify on every code change:**
- `npm run build` completes (proves all server actions export async)
- `npm run lint` passes
- `npm run typecheck` passes (strict mode)
- `npm test` passes (125 tests across 21 files)
- `npm run check:migration-drift` passes (schema and migrations in sync)
- `npm run verify` passes (full release gate)

**Production-only:**
- `PAYLOAD_DATABASE_PUSH=false` (enforced by `database-guards.ts`)
- `DATABASE_SSL_CA` set to actual PEM file (enforced by `database-guards.ts`)
- Never set `DATABASE_SSL_REJECT_UNAUTHORIZED=true` in Production
- `S3_*` vars for private Supabase Storage bucket
- Separate Vercel and Supabase environments per `AGENTS.md`

## Testing Patterns

**Integration tests** (`.int.spec.ts`):
- Tenant isolation: cross-tenant reads/writes rejected, no data leak
- Publishing: Draft → Review → Published workflow
- Storage privacy: Draft/Review files inaccessible, Published via `/api/media/file/*` only
- Public API: anonymous serializer strips internal fields
- Run with `npm test` or `npm run test:watch`

**Key test files:**
- `tests/tenant-isolation.int.spec.ts` — multi-tenant authorization
- `tests/publishing.spec.ts` — Draft/Review/Published state machine
- `tests/storage-privacy.spec.ts` — media bucket and auth
- `tests/sprint3-public-api.int.spec.ts` — serializer validation
- `tests/migration-drift.spec.ts` — schema/migration sync guard
- `tests/use-server-exports.spec.ts` — server-action syntax validation

**Local verification:**
```bash
npm run lint && npm run typecheck && npm test && npm run build
# or for the full release gate:
npm run verify
```

Then manually verify the route and role matrix in `docs/TESTING.md` at desktop and mobile widths.

## Important Files and When to Read Them

- **`AGENTS.md`** — Implementation contract; read first if unclear about product direction or priorities
- **`docs/ARCHITECTURE.md`** — System boundaries, request flow, Sprint 2 content architecture
- **`docs/SECURITY.md`** — Threat model, TLS, storage, rotation, incident response
- **`docs/TESTING.md`** — Test matrix, manual smoke test, review handoffs
- **`docs/decisions/`** — ADRs (0001–0022) record all major decisions; reference when uncertain
- **`src/lib/public-data.ts`** — Serialization for anonymous access; all new public surfaces must use or compose this
- **`src/lib/tenant.ts`** — Tenant resolution and validation helpers
- **`src/lib/auth.ts`** — Session and membership extraction; rely on these for server-side authorization
- **`src/lib/publishing.ts`** — Publication state and disclosure field protection logic
- **`src/collections/`** — Payload collection definitions; pattern to follow for new collections

## Environment Variables

**Required locally:**
- `DATABASE_URI` — Postgres or Supabase connection string
- `PAYLOAD_SECRET` — Encryption/session signing secret (rotate in production; see ADR-0006)
- `NEXT_PUBLIC_SERVER_URL` — Public origin (`http://localhost:3000` locally)
- `DEFAULT_TENANT_SLUG` — Local tenant slug (`qelvarion-resource` locally; never on production-like hosts)

**Optional:**
- `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT` — Supabase Storage for cloud media
- `DATABASE_SSL_CA` — PEM file for Postgres TLS (required on Preview/Prod)
- `PAYLOAD_DATABASE_PUSH` — `true` locally, `false` or absent elsewhere, fatal if `true` in Production
- `DATABASE_SSL_REJECT_UNAUTHORIZED` — `false` dev-only (logs warning); never in Production
- `SEED_PLATFORM_EMAIL`, `SEED_PLATFORM_PASSWORD`, `SEED_COMPANY_ADMIN_EMAIL`, `SEED_COMPANY_ADMIN_PASSWORD` — Local seed credentials

See `npm run check:env` to report required vars per environment.

## Deployment Reality

- **Live domain:** `nrlaunch.com` (Vercel Production, Supabase Production `bwftfsfbiyzgwztwtqmh`)
- **Staging:** Supabase staging project `jthotkkremiesvocfsmr`
- **Hostname routing:** `nrlaunch.com` (platform shell, not a tenant) → `<tenant>.nrlaunch.com` → tenant IR site; `admin.nrlaunch.com` → all authenticated surfaces
- **Unknown/reserved subdomains:** 404, fail-closed
- **Vercel environment variables:** Separate per environment (Preview vs. Production); a variable set only for Preview does not reach Production builds
- Never run `seed:reset` against Production

## Related Documentation

- [README.md](README.md) — Setup, route map, scripts, prerequisites
- [AGENTS.md](AGENTS.md) — Project mission, sprint status, open findings, promotion gates
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design, boundaries, request flow
- [docs/SECURITY.md](docs/SECURITY.md) — Threat model, credentials, TLS, incident response
- [docs/TESTING.md](docs/TESTING.md) — Test matrix, smoke test, review handoffs
- [docs/SPRINT6_REVIEW.md](docs/SPRINT6_REVIEW.md) — Latest review findings and remediation
- [docs/decisions/](docs/decisions/) — ADRs 0001–0022 (all decisions recorded here)
