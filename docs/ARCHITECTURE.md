# Architecture

## Sprint 1 Shape

Use one Next.js application with clearly separated public, Company Admin and Platform Admin route groups. Payload CMS provides structured content and admin-facing data access. PostgreSQL/Supabase is the persistence layer.

The public website reads tenant-scoped records through server-side queries filtered to `Published`. Dashboard and admin mutations pass through authenticated server-side authorization.

## Implementation Choices (Sprint 1)

Recorded in [ADR-0005](decisions/ADR-0005-auth-tenant-resolution-cms-path.md):

- Payload `3.87.1` + Next.js `15.4.11` + `@payloadcms/db-postgres`
- Auth: Payload Users collection + `payload-token` cookie
- Platform Admin: `users.platformRole`
- Company Admin: `tenant-memberships.role = company_admin`
- Public tenant resolution: header → tenant subdomain (not `*.vercel.app` / localhost) → `DEFAULT_TENANT_SLUG`
- Payload CMS UI mounted at `/cms` to leave `/admin/*` for product Platform Admin routes
- Schema sync: Postgres adapter `push: true` for local Sprint 1 speed; Sprint 2 gates push with `PAYLOAD_DATABASE_PUSH` and adds checked-in migrations for staging
- Media: local filesystem by default; Supabase Storage via `@payloadcms/storage-s3` when `S3_*` env vars are set ([ADR-0007](decisions/ADR-0007-supabase-storage-and-migrations.md))

## Boundaries

- Public routes: published investor-facing data only.
- Company Admin routes: one active tenant membership only.
- Platform Admin routes: cross-tenant management with an explicit platform role.
- Seed scripts: create Qelvarion Resource and test memberships; they must not make Qelvarion Resource a global runtime assumption.

## Sprint 4 public discovery and maps

- Server-side published-only search/filter on Projects, News and Documents ([ADR-0011](decisions/ADR-0011-public-explorer-discovery-contract.md)).
- Related content on project detail is same-tenant Published news/documents only.
- Project maps use a provider-neutral OSM embed with accessible text fallback; no paid API keys ([ADR-0010](decisions/ADR-0010-project-map-provider-and-data-policy.md)).
- Investor accounts, market data and subscriptions remain out of scope ([ADR-0009](decisions/ADR-0009-sprint4-investor-feature-boundary.md)).

## Request Flow

1. Resolve the tenant from the hostname, route context or authenticated dashboard selection.
2. Validate the tenant exists and is active.
3. Check the session and membership server-side for private routes.
4. Apply tenant and publication filters in the data query.
5. Validate mutations and audit the publication-sensitive transition.

## Failure Behavior

Return not-found for records outside a user's tenant where appropriate, and forbidden for known unauthorized actions. Do not expose another tenant's names, IDs or draft content through errors.

## Sprint 2 Content Architecture

Extend the existing Payload collections and access helpers rather than creating a second content system. Each collection must expose the same concepts: tenant relationship, content fields, status, disclosure level where relevant, source reference and review metadata.

Use shared helpers for tenant authorization, Published-only public queries, status transitions, disclosure-field protection and review metadata. Public Explorer pages must query server-side with tenant and Published filters; do not fetch broad collections and filter in React. Omit reviewer identity, internal notes and draft status from public responses.

## Sprint 2 Request Flow

1. Authenticate and authorize the dashboard request.
2. Resolve tenant scope from the active server-side membership.
3. Validate the content payload and source reference.
4. Save Draft or Review content without publishing it.
5. Approve through a separate status-only server action.
6. Revalidate the relevant public route after publication.

Public list pages must use bounded queries and stable ordering. Detail pages should return not-found for non-published or wrong-tenant records. Missing optional content should render an intentional empty state rather than a 500 error.

## Sprint 2 Cloud Deployment

The target staging topology is Vercel Pro for the Next.js/Payload application and Supabase Pro for PostgreSQL. Supabase Storage is the default Sprint 2 media choice unless an ADR selects Vercel Blob or Amazon S3.

Use separate Supabase staging and production projects or otherwise strictly separated databases. Vercel Preview and Production environments must use separate environment variables and must never point at the local database. Runtime connections should use the appropriate Supabase pooler for serverless traffic. Schema changes must use controlled migrations or a documented, repeatable staging procedure; do not rely on `push: true` as the production migration strategy.

Vercel's ephemeral filesystem is not permanent media storage. Payload uploads must use persistent object storage before media or document uploads are considered production-ready.
