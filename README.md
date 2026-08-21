# Mining IR Platform

Self-service, multi-tenant investor relations websites for junior mining companies.

## Sprint 3

Sprint 2 implementation is complete. Sprint 3 is the release-readiness gate before investor-facing expansion.

The immediate objective is to close the findings from the independent Sprint 2 review: private Supabase Storage, credential rotation and session invalidation, verified database TLS, incremental migration testing, real cloud media verification, public API data minimization, production guard enforcement, committed remediation and operational recovery evidence.

Do not add live market data, analytics, subscriptions or investor accounts in Sprint 3. Those features are planned after the product can safely protect unpublished technical content in staging and production-like conditions.

Read [`docs/SPRINT3_HANDOFF.md`](docs/SPRINT3_HANDOFF.md) for the Cursor implementation brief and review handoff.

## Sprint 2 Baseline

Sprint 2 extends the completed vertical slice with structured mining content:

1. Company Admin manages news, documents, management, share structure and exploration content.
2. Disclosure-sensitive content follows an explicit review and approval workflow.
3. Investors see only published content in the Explorer website.

Sprint 1 remains the baseline. Re-run its public routes, dashboard workflow, tenant isolation checks and review-gate tests after Sprint 2 changes.

### Sprint 2 Routes

- Public: `/news`, `/news/[slug]`, `/documents`, `/management`, `/share-structure`, and project exploration content using the existing route convention.
- Company Admin: `/dashboard/news`, `/dashboard/documents`, `/dashboard/management`, `/dashboard/share-structure`, `/dashboard/exploration`.
- Existing Sprint 1 routes remain required.

### Sprint 2 Content

News releases, documents/presentations, management profiles, share structure and exploration content. Live market data, investor accounts, AI extraction, regulatory ingestion, billing and advanced GIS remain out of scope.

## Sprint 1 Baseline

Sprint 1 proves the first complete loop:

1. A Platform Admin provisions Qelvarion Resource.
2. A Company Admin edits tenant-scoped company and project data.
3. Investors see published data through the Explorer website.

The public Sprint 1 surface is Home, Projects and Project Detail. News, investor accounts, billing, AI extraction and production provisioning are out of scope.

## Stack

- Next.js 15.4, React 19, TypeScript and Tailwind CSS 4
- Payload CMS 3.87
- PostgreSQL (local) / Supabase-compatible connection string
- Vercel and Cloudflare as initial deployment targets

## Prerequisites

- Node.js 20.9+ (Node 22+ recommended)
- npm 10+
- PostgreSQL 14+ running locally (or a Supabase Postgres URL)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit DATABASE_URI / PAYLOAD_SECRET if needed

# 3. Create the local database (example for Homebrew Postgres)
createdb mining_ir

# 4. Push schema (Payload postgres push is enabled for Sprint 1)
# Starting the app or running seed will initialize collections.

# 5. Seed Qelvarion Resource + local admins
npm run seed

# Reset seed data if needed:
npm run seed:reset

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URI` | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Payload encryption/session secret |
| `NEXT_PUBLIC_SERVER_URL` | Public site origin (`http://localhost:3000`) |
| `DEFAULT_TENANT_SLUG` | Local public tenant slug (`qelvarion-resource`) |
| `PAYLOAD_DATABASE_PUSH` | Opt-in schema push (`true` locally). Missing/false elsewhere; **forbidden** in `NODE_ENV=production` |
| `DATABASE_SSL_CA` | PEM CA for Postgres TLS (required on Preview/Production). Prefer over disabling verification |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Non-production only fallback (`false` disables cert verify and logs a warning) |
| `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_REGION` / `S3_ENDPOINT` | Optional Supabase Storage (S3-compatible); keep bucket **private**; app serves via `/api/media/file/*` |
| `SEED_PLATFORM_EMAIL` | Local Platform Admin email |
| `SEED_PLATFORM_PASSWORD` | Local Platform Admin password (dev only) |
| `SEED_COMPANY_ADMIN_EMAIL` | Local Company Admin email |
| `SEED_COMPANY_ADMIN_PASSWORD` | Local Company Admin password (dev only) |

Never commit real credentials. `.env.local` is gitignored.

## Local Login

After `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Platform Admin | value of `SEED_PLATFORM_EMAIL` | value of `SEED_PLATFORM_PASSWORD` |
| Company Admin (Qelvarion Resource) | value of `SEED_COMPANY_ADMIN_EMAIL` | value of `SEED_COMPANY_ADMIN_PASSWORD` |

Both are read from your local `.env.local` (gitignored) by `npm run seed`. Change them there, not here — literal credentials are never published in this repository, including for local development.

- Company Admin → `/login` → `/dashboard`
- Platform Admin → `/login` → `/admin/tenants`
- Payload CMS UI → `/cms` (Platform Admin only)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js + Payload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest unit + integration tests |
| `npm run seed` | Seed demo tenant and users |
| `npm run seed:reset` | Clear seeded collections and reseed (local/staging only — never Production) |
| `npm run migrate` | Run Payload Postgres migrations (required when `PAYLOAD_DATABASE_PUSH=false`) |
| `npm run migrate:create` | Generate a new migration from schema changes |
| `npm run verify` | lint + typecheck + test + migration-drift + `build:ci` — the release gate |
| `npm run check:env` | Report required environment variables per environment (never prints values) |
| `npm run check:migration-drift` | Fail if a collection field has no corresponding migration |
| `npm run check:storage-privacy` | Probe that a Supabase Storage object is not anonymously downloadable |
| `npm run test:incremental-migration` | Rehearse an incremental migration on a disposable database |
| `npm run generate:types` | Regenerate `src/payload-types.ts` |
| `npm run generate:importmap` | Regenerate Payload import map |

## Route Map

- Public: `/`, `/projects`, `/projects/[slug]`, `/news`, `/news/[slug]`, `/documents`, `/management`, `/share-structure`
- Placeholders: `/investors`, `/corporate`, `/contact`
- Company Admin: `/login`, `/logout`, `/dashboard`, `/dashboard/company`, `/dashboard/projects`, `/dashboard/news`, `/dashboard/documents`, `/dashboard/management`, `/dashboard/share-structure`, `/dashboard/exploration`
- Platform Admin: `/admin/tenants`, `/admin/users`
- Payload CMS: `/cms`

## Local Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or: npm run verify
npm run dev
```

Manually verify the route and role matrix in [`docs/TESTING.md`](docs/TESTING.md) at desktop and mobile widths.

For Claude/human review after a run, use:

- **[docs/SPRINT1_HANDOFF.md](docs/SPRINT1_HANDOFF.md)** — Sprint 1 baseline
- **[docs/SPRINT2_HANDOFF.md](docs/SPRINT2_HANDOFF.md)** — Sprint 2 mining content + staging results

## Cloud Staging and Release Readiness

The project owner has Vercel Pro and Supabase Pro. Sprint 2 must be tested in a Vercel Preview deployment backed by a Supabase Pro staging database before production release.

Recommended Sprint 2 cloud setup:

- Vercel Pro for Preview and Production deployments.
- Supabase Pro for PostgreSQL and Supabase Storage for media ([ADR-0007](docs/decisions/ADR-0007-supabase-storage-and-migrations.md)).
- Cloudflare Free for DNS when a custom domain is connected.
- No separate Amazon S3 or Vercel database is required for Sprint 2 unless an ADR explains the change.

Configure Preview and Production variables separately. At minimum: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DEFAULT_TENANT_SLUG`, `PAYLOAD_DATABASE_PUSH=false`, and Supabase Storage (`S3_*`) variables. Never place secret values in Git, Notion or this README.

Staging schema: set `PAYLOAD_DATABASE_PUSH` unset or `false` and run `npm run migrate` against the staging database. Seed with `npm run seed` (never `seed:reset` against Production). Set `DATABASE_SSL_CA` for Preview/Production TLS. Keep the Supabase `media` bucket private.

Before Claude reviews Sprint 3, Cursor must deploy a Preview, seed only fictional staging data, verify public and authenticated flows on the Preview URL, prove private storage with a real uploaded file, and report the URL plus migration, rotation, TLS, media and restore-test results. See [`docs/SPRINT3_HANDOFF.md`](docs/SPRINT3_HANDOFF.md) for the full checklist.

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data Model](docs/DATA_MODEL.md)
- [Design](docs/DESIGN.md)
- [Roadmap](docs/ROADMAP.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Sprint 1 Review Handoff](docs/SPRINT1_HANDOFF.md)
- [ADRs](docs/decisions/ADR-0001-self-service-multi-tenant-saas.md)
- [Production-readiness ADR](docs/decisions/ADR-0008-production-readiness-gates-before-investor-features.md)
- [Sprint 2 implementation handoff](docs/SPRINT2_HANDOFF.md)
- [Sprint 3 production-hardening handoff](docs/SPRINT3_HANDOFF.md)

`AGENTS.md` is the implementation contract. When code and documentation disagree, pause and record the decision before changing the product direction.
