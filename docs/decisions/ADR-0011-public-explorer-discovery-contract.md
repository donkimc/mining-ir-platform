# ADR-0011: Public Explorer Discovery Contract

## Status

Accepted for Sprint 4 (2026-08-16).

## Context

Investors need to find Published content without accounts. Broad client-side fetches of all tenants would recreate the M-1 / M2 class of leaks.

## Decision

Public discovery uses **server-side** queries only:

- Resolve one tenant via `requirePublishedTenant()` / `resolveTenantSlug`.
- Filter `status = published` (or company `publicationStatus = published`) at query time.
- Bounded limits (≤100 per list) and stable sort orders.
- Supported filters (query params):
  - Projects: `q` (name/summary), `commodity`, `stage`
  - News: `q` (title/excerpt)
  - Documents: `q` (title), `category`
- Related content on project detail: same-tenant Published news/documents that reference the project, plus exploration already loaded.
- Public serializers strip review metadata, tenant relation IDs, and platform routing fields (`websiteDomain`, `subdomain`, `templateKey`) for anonymous API reads.
- No visitor identifiers, saved searches, analytics events or email addresses are stored.

## Consequences

- Empty/invalid filters produce intentional empty states without leaking Draft existence.
- New search indexes require an additive migration in the same commit if introduced later.
- Cross-tenant related links are rejected by existing relation guards and published-only queries.
