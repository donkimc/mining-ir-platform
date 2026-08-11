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
- Public tenant resolution: header → subdomain → `DEFAULT_TENANT_SLUG`
- Payload CMS UI mounted at `/cms` to leave `/admin/*` for product Platform Admin routes
- Schema sync: Postgres adapter `push: true` for local Sprint 1 speed

## Boundaries

- Public routes: published investor-facing data only.
- Company Admin routes: one active tenant membership only.
- Platform Admin routes: cross-tenant management with an explicit platform role.
- Seed scripts: create Aurora Gold and test memberships; they must not make Aurora Gold a global runtime assumption.

## Request Flow

1. Resolve the tenant from the hostname, route context or authenticated dashboard selection.
2. Validate the tenant exists and is active.
3. Check the session and membership server-side for private routes.
4. Apply tenant and publication filters in the data query.
5. Validate mutations and audit the publication-sensitive transition.

## Failure Behavior

Return not-found for records outside a user's tenant where appropriate, and forbidden for known unauthorized actions. Do not expose another tenant's names, IDs or draft content through errors.
