# Mining IR Platform

Self-service, multi-tenant investor relations websites for junior mining companies.

## Sprint 1

Sprint 1 proves the first complete loop:

1. A Platform Admin provisions Aurora Gold.
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

# 5. Seed Aurora Gold + local admins
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
| `DEFAULT_TENANT_SLUG` | Local public tenant slug (`aurora-gold`) |
| `SEED_PLATFORM_EMAIL` | Local Platform Admin email |
| `SEED_PLATFORM_PASSWORD` | Local Platform Admin password (dev only) |
| `SEED_COMPANY_ADMIN_EMAIL` | Local Company Admin email |
| `SEED_COMPANY_ADMIN_PASSWORD` | Local Company Admin password (dev only) |

Never commit real credentials. `.env.local` is gitignored.

## Local Login

After `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Platform Admin | `platform@mining-ir.local` | `ChangeMeLocal1!` |
| Company Admin (Aurora Gold) | `admin@auroragold.local` | `ChangeMeLocal1!` |

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
| `npm run seed:reset` | Clear seeded collections and reseed |
| `npm run generate:types` | Regenerate `src/payload-types.ts` |
| `npm run generate:importmap` | Regenerate Payload import map |

## Route Map

- Public: `/`, `/projects`, `/projects/[slug]`
- Placeholders: `/news`, `/investors`, `/corporate`, `/contact`
- Company Admin: `/login`, `/logout`, `/dashboard`, `/dashboard/company`, `/dashboard/projects`
- Platform Admin: `/admin/tenants`, `/admin/users`
- Payload CMS: `/cms`

## Local Verification

```bash
npm run lint
npm run typecheck
npm test
npm run dev
```

Manually verify the route and role matrix in [`docs/TESTING.md`](docs/TESTING.md) at desktop and mobile widths.

For Claude/human review after a run, use the Sprint 1 handoff:

**[docs/SPRINT1_HANDOFF.md](docs/SPRINT1_HANDOFF.md)** — shipped scope, local login, command results, decisions, known limitations, and review focus.

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

`AGENTS.md` is the implementation contract. When code and documentation disagree, pause and record the decision before changing the product direction.
