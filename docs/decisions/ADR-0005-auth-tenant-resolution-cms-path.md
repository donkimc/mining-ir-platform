# ADR-0005: Auth, Tenant Resolution and CMS Admin Path

## Status

Accepted

## Context

Sprint 1 needs authenticated Company Admin and Platform Admin surfaces, tenant-scoped public reads, and Payload CMS without colliding with product `/admin` routes.

## Decision

1. **Authentication:** Payload built-in Users auth (`payload.login` + `payload-token` httpOnly cookie). Documented local seed credentials only.
2. **Platform role:** `users.platformRole = platform_admin` for cross-tenant access. Tenant roles live on `tenant-memberships`.
3. **Tenant resolution (public):** `x-tenant-slug` header, else subdomain label, else `DEFAULT_TENANT_SLUG` for local single-hostname development.
4. **Payload CMS UI path:** `/cms` so product Platform Admin can own `/admin/tenants` and `/admin/users`.
5. **Database:** PostgreSQL via `@payloadcms/db-postgres` with `push: true` for Sprint 1 local schema sync. Formal migrations can harden later.
6. **Payload / Next versions:** Payload `3.87.1` with Next.js `15.4.11` (Payload-supported 15.4.x range).

## Consequences

Local demo depends on `DEFAULT_TENANT_SLUG=aurora-gold`. Custom domains and multi-tenant host routing remain later work. Company Admins never trust browser-supplied tenant IDs for writes.
